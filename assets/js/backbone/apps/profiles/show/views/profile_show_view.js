// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var jqIframe = require('blueimp-file-upload/js/jquery.iframe-transport');
var jqFU = require('blueimp-file-upload/js/jquery.fileupload.js');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');
var marked = require('marked');
var MarkdownEditor = require('../../../../components/markdown_editor');

// internal dependencies
var UIConfig = require('../../../../config/ui.json');
var TagShowView = require('../../../tag/show/views/tag_show_view');
var Login = require('../../../../config/login.json');
var ModalComponent = require('../../../../components/modal');
var ProfileActivityView = require('./profile_activity_view');
var TagFactory = require('../../../../components/tag_factory');

// templates
var ProfileShowTemplate = require('../templates/profile_show_template.html');
var ProfileEditTemplate = require('../templates/profile_edit_template.html');
var ShareTemplate = require('../templates/profile_share_template.txt');
var ProfileCreatedTemplate = require('../templates/profile_created_template.html');
var ProfileParticipatedTemplate = require('../templates/profile_participated_template.html');


var ProfileShowView = Backbone.View.extend({
  events: {
    'keyup .validate'            : 'validateField',
    'change .validate'           : 'validateField',
    'blur .validate'             : 'validateField',
    'submit #profile-form'       : 'profileSubmit',
    'click #profile-save'        : 'profileSave',
    'click .link-backbone'       : linkBackbone,
    'click #profile-cancel'      : 'profileCancel',
    'keyup .form-control'        : 'fieldModified',
    'change .form-control'       : 'fieldModified',
    'blur .form-control'         : 'fieldModified',
    'click .removeAuth'          : 'removeAuth',
  },

  initialize: function (options) {
    var self = this;
    var model = this.model.toJSON();
    var currentUser = window.cache.currentUser || {};
    var isAdmin = currentUser.isAdmin;
    var career = [];

    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];
    this.edit = false;

    $.ajax({
      url: '/api/ac/tag?type=career&list',
      type: 'GET',
      async: false,
      success: function (data) {
        this.tagTypes = { career: data };
      }.bind(this),
    });

    if (this.options.action === 'edit') {
      this.edit = true;

      // Check if the user is not an admin and editing another profile other than
      // the current user.
      if (model.id !== currentUser.id && !model.canEditProfile) {
        this.edit = false;
        Backbone.history.navigate('profile/' + model.id, {
          trigger: false,
          replace: true,
        });
      }
    }

    if (this.data.saved) {
      this.saved = true;
      this.data.saved = false;
    }
    // Handle server side errors
    this.model.on('error', function (model, xhr) {
      var error = xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            self.$('#' + item + '-update-alert-message').html(message);
            self.$('#' + item + '-update-alert').show();
          }
        }
      } else if (error) {
        var alertText = xhr.statusText + '. Please try again.';
        $('.alert.alert-danger').text(alertText).show();
        $(window).animate({ scrollTop: 0 }, 500);
      }
    });
  },

  getTags: function (types) {
    var allTags = this.model.attributes.tags;
    var result = _.filter(allTags, function (tag) {
      return _.contains(types, tag.type);
    });
    return result;
  },

  validateField: function (e) {
    return validate(e);
  },

  render: function () {
    var data = {
      login: Login,
      data: this.model.toJSON(),
      tags: this.getTags(['skill', 'topic']),
      skillsTags: this.getTags(['skill']),
      interestsTags: this.getTags(['topic']),
      tagTypes: this.tagTypes,
      user: window.cache.currentUser || {},
      edit: false,
      saved: this.saved,
      ui: UIConfig,
    };

    data.email = data.data.username;
    data.career = this.getTags(['career'])[0];

    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }

    var template = this.edit ? _.template(ProfileEditTemplate)(data) : _.template(ProfileShowTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();

    // initialize sub components
    this.initializeFileUpload();
    this.initializeForm();
    this.initializeSelect2();
    this.initializeTags();
    this.initializeProfileActivityView();
    this.initializeTextArea();
    this.updatePhoto();
    this.updateProfileEmail();

    // Force reloading of image (in case it was changed recently)
    if (data.user.id === data.data.id) {
      var url = '/api/user/photo/' + data.user.id + '?' + new Date().getTime();
      $('#project-header').css('background-image', "url('" + url + "')");
    }
    return this;
  },

  initializeFileUpload: function () {
    var self = this;

    $('#fileupload').fileupload({
      url: '/api/upload/create',
      dataType: 'text',
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
      formData: { 'type': 'image_square' },
      add: function (e, data) {
        self.$('#file-upload-progress-container').show();
        data.submit();
      },
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        self.$('#file-upload-progress').css(
          'width',
          progress + '%'
        );
      },
      done: function (e, data) {
        var result;
        // for IE8/9 that use iframe
        if (data.dataType == 'iframe text') {
          result = JSON.parse(data.result);
        }
        // for modern XHR browsers
        else {
          result = JSON.parse($(data.result).text());
        }
        self.model.trigger('profile:updateWithPhotoId', result[0]);
        // in case there was a previous error
        self.$('#file-upload-alert').hide();
      },
      fail: function (e, data) {
        // notify the user that the upload failed
        var message = data.errorThrown;
        self.$('#file-upload-progress-container').hide();
        if (data.jqXHR.status == 413) {
          message = 'The uploaded file exceeds the maximum file size.';
        }
        self.$('#file-upload-alert-message').html(message);
        self.$('#file-upload-alert').show();
      },
    });

  },

  initializeTags: function () {
    var showTags = true;
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.edit) showTags = false;

    // this is only used for edit view now
    // TODO: refactor / rename, either reuse or simplify
    this.tagView = new TagShowView({
      model: this.model,
      el: '.tag-wrapper',
      target: 'profile',
      targetId: 'userId',
      edit: this.edit,
      showTags: showTags,
    });
    this.tagView.render();
  },

  initializeProfileActivityView: function () {
    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    $.ajax('/api/user/activities/' + this.model.attributes.id).done(function (data) {
      this.taskView = new ProfileActivityView({
        model: this.model,
        el: '.task-createdactivity-wrapper',
        template: ProfileCreatedTemplate,
        target: 'task',
        handle: 'task',  // used in css id
        data: data.tasks.created,
      });
      this.taskView.render();
      this.volView = new ProfileActivityView({
        model: this.model,
        el: '.task-activity-wrapper',
        template: ProfileParticipatedTemplate,
        target: 'task',
        handle: 'volTask',  // used in css id
        data: data.tasks.volunteered,
        getStatus: this.getStatus,
      });
      this.volView.render();
    }.bind(this));
  },

  initializeForm: function () {
    var self = this;

    this.listenTo(self.model, 'profile:save:success', function (data) {
      // Bootstrap .button() has execution order issue since it
      // uses setTimeout to change the text of buttons.
      // make sure attr() runs last
      $('#submit').button('success');
      // notify listeners if the current user has been updated
      if (self.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger('user:profile:save', data.toJSON());
      }

      // setTimeout(function () { $('#profile-save, #submit').attr('disabled', 'disabled'); },0);
      $('#profile-save, #submit').removeClass('btn-primary');
      $('#profile-save, #submit').addClass('btn-success');
      self.data.saved = true;
      Backbone.history.navigate('profile/' + self.model.toJSON().id, { trigger: true });
    });

    this.listenTo(self.model, 'profile:save:fail', function (data) {
      $('#submit').button('fail');
    });
    this.listenTo(self.model, 'profile:removeAuth:success', function (data, id) {
      self.render();
    });

    setTimeout(function () {
      $('.skill-aside .skills').appendTo('#s2id_tag_skill');
      $('.skill-aside .interests').appendTo('#s2id_tag_topic');
    }, 500);
  },

  initializeSelect2: function () {
    var self = this;
    var modelJson = this.model.toJSON();

    /*
      The location and company selectors differ from the
      defaults in tag_show_view, so they are explicitly
      created here (with different HTML IDs than normal,
      to avoid conflicts).
    */

    this.tagFactory.createTagDropDown({
      type:        'location',
      selector:    '#location',
      multiple:    false,
      data:        modelJson.location,
      width:       '100%',
    });

    this.tagFactory.createTagDropDown({
      type:        'agency',
      selector:    '#company',
      multiple:    false,
      allowCreate: false,
      data:        modelJson.agency,
      width:       '100%',
    });

    $('#career-field').select2({
      placeholder: '-Select-',
      width: '100%',
      allowClear: true,
    });

  },

  initializeTextArea: function () {
    if (this.md) { this.md.cleanup(); }
    this.md = new MarkdownEditor({
      data: this.model.toJSON().bio,
      el: '.markdown-edit',
      id: 'bio',
      placeholder: 'A short biography.',
      title: 'Biography',
      rows: 6,
      validate: ['html'],
    }).render();
  },

  fieldModified: function (e) {
    this.model.trigger('profile:input:changed', e);

    if($(e.currentTarget).hasClass('validate')) {
      validate(e);
    }
  },

  updateProfileEmail: function (){
    var subject = 'Take A Look At This Profile',
        data = {
          profileTitle: this.model.get('title'),
          profileLink: window.location.protocol +
            '//' + window.location.host + '' + window.location.pathname,
          profileName: this.model.get('name'),
          profileLocation: this.model.get('location') ?
            this.model.get('location').name : '',
          profileAgency: this.model.get('agency') ?
            this.model.get('agency').name : '',
          i18n: i18n,
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
  },

  getStatus: function (task) {
    switch (task.state) {
      case 'completed':
        return (task.assigned ? (task.taskComplete ? 'Complete' : 'Not complete') : 'Not assigned');
      case 'in progress':
        return (task.assigned ? (task.taskComplete ? 'Complete' : 'Assigned') : 'Not assigned');
      case 'canceled':
        return 'Canceled';
      default:
        return (task.assigned ? 'Assigned' : 'Applied');
    }
  },

  updatePhoto: function () {
    var self = this;
    this.model.on('profile:updatedPhoto', function (data) {
      //added timestamp to URL to force FF to reload image from server
      var url = '/api/user/photo/' + data.attributes.id + '?' + new Date().getTime();
      $('#project-header').css('background-image', "url('" + url + "')");
      $('#file-upload-progress-container').hide();
      // notify listeners of the new user image, but only for the current user
      if (self.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger('user:profile:photo:save', url);
      }
    });
  },

  profileCancel: function (e) {
    e.preventDefault();
    Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
  },

  profileSave: function (e) {
    e.preventDefault();
    $('#profile-form').submit();
  },

  profileSubmit: function (e) {
    e.preventDefault();

    // If the name isn't valid, don't put the save through
    if (validate({ currentTarget: '#name' })) {
      return;
    }

    $('#profile-save, #submit').button('loading');

    var newTags = [].concat(
          $('#company').select2('data'),
          $('#career-field').select2('data'),
          $('#tag_topic').select2('data'),
          $('#tag_skill').select2('data'),
          $('#location').select2('data')
        ),
        data = {
          name:  $('#name').val().trim(),
          title: $('#jobtitle').val(),
          bio: $('#bio').val(),
          username: $('#profile-email').val(),
        },
        email = this.model.get('username'),
        self = this,
        tags = _(newTags).chain()
          .filter(function (tag) {
            return _(tag).isObject() && !tag.context;
          })
          .map(function (tag) {
            return (tag.id && tag.id !== tag.name) ? +tag.id : {
              name: tag.name,
              type: tag.tagType,
              data: tag.data,
            };
          }).unique().value();

    data.tags = tags;

    this.model.trigger('profile:save', data);
  },

  removeAuth: function (e) {
    if (e.preventDefault) e.preventDefault();
    var node = $(e.currentTarget);
    this.model.trigger('profile:removeAuth', node.data('service'));
  },

  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    removeView(this);
  },

});

module.exports = ProfileShowView;
