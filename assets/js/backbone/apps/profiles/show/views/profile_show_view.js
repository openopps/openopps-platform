// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');

// internal dependencies
var UIConfig = require('../../../../config/ui.json');
var TagShowView = require('../../../tag/show/views/tag_show_view');
var Login = require('../../../../config/login.json');
var TagFactory = require('../../../../components/tag_factory');

// templates
var ProfileShowTemplate = require('../templates/profile_show_template.html');
var ShareTemplate = require('../templates/profile_share_template.txt');

var ProfileShowView = Backbone.View.extend({
  events: {
    'change .validate'           : 'validateField',
    'blur .validate'             : 'validateField',
    'click .link-backbone'       : linkBackbone,
    'change .form-control'       : 'fieldModified',
    'blur .form-control'         : 'fieldModified',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];

    this.initializeAction();
    this.initializeErrorHandling();
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

    data.email = (loginGov ? data.data.governmentUri : data.data.username);
    data.career = this.getTags(['career'])[0];

    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }

    var template = _.template(ProfileShowTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();

    // initialize sub components
    this.initializeFileUpload();
    this.initializeTags();
    this.updatePhoto();
    this.shareProfileEmail();

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

  shareProfileEmail: function (){
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
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
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

  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    removeView(this);
  },
});

module.exports = ProfileShowView;
