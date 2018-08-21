// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var jqIframe = require('blueimp-file-upload/js/jquery.iframe-transport');
var jqFU = require('blueimp-file-upload/js/jquery.fileupload.js');
var marked = require('marked');
var MarkdownEditor = require('../../../../components/markdown_editor');

// internal dependencies
var UIConfig = require('../../../../config/ui.json');
var TagShowView = require('../../../tag/show/views/tag_show_view');
var Login = require('../../../../config/login.json');
var ModalComponent = require('../../../../components/modal');
var TagFactory = require('../../../../components/tag_factory');

// templates
var ProfileEditTemplate = require('../templates/profile_edit_template.html');
var ProfileSkillsTemplate = require('../../show/templates/profile_skills_template.html');

var ProfileEditView = Backbone.View.extend({
  events: {
    'change .validate'           : 'validateField',
    'blur .validate'             : 'validateField',
    'click #profile-save'        : 'profileSubmit',
    'click .link-backbone'       : linkBackbone,
    'click #profile-cancel'      : 'profileCancel',
    'change .form-control'       : 'fieldModified',
    'blur .form-control'         : 'fieldModified',
    'click .removeAuth'          : 'removeAuth',
  },

  initialize: function (options) {
    var career = [];
    
    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];
    
    this.initializeCareerList();
    this.initializeAction();
    this.initializeErrorHandling();
    
    if (this.data.saved) {
      this.saved = true;
      this.data.saved = false;
    }
  },

  initializeCareerList: function () {
    $.ajax({
      url: '/api/ac/tag?type=career&list',
      type: 'GET',
      async: false,
      success: function (data) {
        this.tagTypes = { career: data };
      }.bind(this),
    });
  },

  initializeAction: function () {
    var model = this.model.toJSON();
    var currentUser = window.cache.currentUser || {};
    if (this.options.action === 'edit') {
      this.edit = true;
      if (model.id !== currentUser.id && !model.canEditProfile) {
        this.edit = false;
        Backbone.history.navigate('profile/' + model.id, {
          trigger: false,
          replace: true,
        });
      }
    } else if (this.options.action === 'skills') {
      this.skills = true;
      if (model.id !== currentUser.id && !model.canEditProfile) {
        this.skills = false;
        Backbone.history.navigate('profile/' + model.id, {
          trigger: false,
          replace: true,
        });
      }
    }
  },

  initializeErrorHandling: function () {
    // Handle server side errors
    this.model.on('error', function (model, xhr) {
      var error = xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            $('#' + item + '-update-alert-message').html(message);
            $('#' + item + '-update-alert').show();
          }
        }
      } else if (error) {
        var alertText = xhr.statusText + '. Please try again.';
        $('.alert.alert-danger').text(alertText).show();
        $(window).animate({ scrollTop: 0 }, 500);
      }
    }.bind(this));
  },

  getTags: function (types) {
    var allTags = this.model.attributes.tags;
    var result = _.filter(allTags, function (tag) {
      return _.contains(types, tag.type);
    });
    return result;
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
      skills: false,
      saved: this.saved,
      ui: UIConfig,
    };
    
    data.email = data.data.username;
    data.career = this.getTags(['career'])[0];
    
    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }
    
    var template = _.template(ProfileEditTemplate)(data);
    //this.skills ? _.template(ProfileSkillsTemplate)(data) : _.template(ProfileShowTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    
    // initialize sub components
    this.initializeFileUpload();
    this.initializeForm();
    this.initializeSelect2();
    this.initializeTags();
    this.initializeTextArea();
    this.updatePhoto();
    
    // Force reloading of image (in case it was changed recently)
    if (data.user.id === data.data.id) {
      var url = '/api/user/photo/' + data.user.id + '?' + new Date().getTime();
      $('#profile-picture').attr('src', url);
    }
    return this;
  },
  initializeFileUpload: function () {
    $('#fileupload').fileupload({
      url: '/api/upload/create',
      dataType: 'text',
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
      formData: { 'type': 'image_square' },
      add: function (e, data) {
        $('#file-upload-progress-container').show();
        data.submit();
      }.bind(this),
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#file-upload-progress').css('width', progress + '%');
      }.bind(this),
      done: function (e, data) {
        this.model.trigger('profile:updateWithPhotoId', JSON.parse($(data.result).text())[0]);
        $('#file-upload-alert').hide();
      }.bind(this),
      fail: function (e, data) {
        var message = data.jqXHR.responseText || data.errorThrown;
        $('#file-upload-progress-container').hide();
        if (data.jqXHR.status == 413) {
          message = 'The uploaded file exceeds the maximum file size.';
        }
        $('#file-upload-alert-message').html(message);
        $('#file-upload-alert').show();
      }.bind(this),
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
      skills: this.skills,
      showTags: showTags,
    });
    this.tagView.render();
  },
    
  initializeForm: function () {
    this.listenTo(this.model, 'profile:save:success', function (data) {
      // Bootstrap .button() has execution order issue since it
      // uses setTimeout to change the text of buttons.
      // make sure attr() runs last
      $('#submit').button('success');
      // notify listeners if the current user has been updated
      if (this.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger('user:profile:save', data.toJSON());
      }
      $('#profile-save').removeClass('btn-primary');
      $('#profile-save').addClass('btn-success');
      this.data.saved = true;
      Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
    }.bind(this));
    
    this.listenTo(this.model, 'profile:save:fail', function (data) {
      $('#profile-save').button('fail');
    }.bind(this));
    this.listenTo(this.model, 'profile:removeAuth:success', function (data, id) {
      this.render();
    }.bind(this));
    
    setTimeout(function () {
      $('.skill-aside .skills').appendTo('#s2id_tag_skill');
      $('.skill-aside .interests').appendTo('#s2id_tag_topic');
    }, 500);
  },
    
  initializeSelect2: function () {
    var modelJson = this.model.toJSON();
    
    _.each(['location', 'agency'], function (value) {
      this.tagFactory.createTagDropDown({
        type: value,
        selector:'#' + value,
        multiple: false,
        data: (value == 'location') ? modelJson.location : modelJson.agency,
        allowCreate: (value == 'location') ? true : false,
        width: '100%',
      });
    }.bind(this));
    
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
     
  updatePhoto: function () {
    this.model.on('profile:updatedPhoto', function (data) {
      //added timestamp to URL to force FF to reload image from server
      var url = '/api/user/photo/' + data.attributes.id + '?' + new Date().getTime();
      $('#profile-picture').attr('src', url);
      $('#file-upload-progress-container').hide();
      // notify listeners of the new user image, but only for the current user
      if (this.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger('user:profile:photo:save', url);
      }
    }.bind(this));
  },
    
  profileCancel: function (e) {
    e.preventDefault();
    Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
  },
    
  profileSubmit: function (e) {
    e.preventDefault();
    
    // If the name isn't valid, don't put the save through
    if (validate({ currentTarget: '#name' })) {
      return;
    }
    
    $('#profile-save, #submit').button('loading');
    
    var newTags = [].concat(
          $('#agency').select2('data'),
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
        tags = _(newTags).chain().filter(function (tag) {
          return _(tag).isObject() && !tag.context;
        }).map(function (tag) {
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
    
module.exports = ProfileEditView;