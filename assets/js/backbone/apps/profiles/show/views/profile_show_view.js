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
var fs = require('fs');
var ProfileShowTemplate = fs.readFileSync(`${__dirname}/../templates/profile_show_template.html`).toString();
var ProfileEditTemplate = fs.readFileSync(`${__dirname}/../templates/profile_edit_template.html`).toString();
var ShareTemplate = fs.readFileSync(`${__dirname}/../templates/profile_share_template.txt`).toString();


var ProfileShowView = Backbone.View.extend({
  events: {
    "submit #profile-form"       : "profileSubmit",
    "click #profile-save"        : "profileSave",
    "click .link-backbone"       : linkBackbone,
    "click #profile-cancel"      : "profileCancel",
    "click #like-button"         : "like",
    "keyup"                      : "fieldModified",
    "change"                     : "fieldModified",
    "blur"                       : "fieldModified",
    "click .removeAuth"          : "removeAuth"
  },

  initialize: function (options) {
    var self = this;
    var model = this.model.toJSON();
    var currentUser = window.cache.currentUser || {};
    var isAdmin = currentUser.isAdmin;

    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];
    this.edit = false;

    if ( this.options.action === 'edit' ) {

      this.edit = true;

      // Check if the user is not an admin and editing another profile other than
      // the current user.
      if ( model.id !== currentUser.id && ! isAdmin ) {

        this.edit = false;

        // Navigate to the proper route replacing the `/edit` route in the user's
        // history.
        Backbone.history.navigate(
          'profile/' + model.id,
          {
            trigger: false,
            replace: true,
          }
        );
      }
    }

    if (this.data.saved) {
      this.saved = true;
      this.data.saved = false;
    }
    // Handle email validation errors
    this.model.on('error', function(model, xhr) {
      var error = xhr.responseJSON;
      if (error.invalidAttributes && error.invalidAttributes.username) {
        var message = _(error.invalidAttributes.username)
              .pluck('message').join(', ')
              .replace(/record/g, 'user')
              .replace(/undefined/g, 'email')
              .replace(/`username`/g, 'email');
        self.$("#email-update-alert").html(message).show();
      }
    });
  },

  getTags: function(types) {
    var allTags = this.model.attributes.tags;
    var result = _.filter(allTags, function(tag) {
      return _.contains(types, tag.type);
    });
    return result;
  },
  render: function () {
    var data = {
      login: Login,
      data: this.model.toJSON(),
      tags: this.getTags(['skill', 'topic']),
      user: window.cache.currentUser || {},
      edit: false,
      saved: this.saved,
      ui: UIConfig
    };

    data.email = data.data.username;

    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }

    var template = this.edit ? _.template(ProfileEditTemplate)(data) : _.template(ProfileShowTemplate)(data);
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
      var url = '/api/user/photo/' + data.user.id + "?" + new Date().getTime();
      $("#project-header").css('background-image', "url('" + url + "')");
    }
    return this;
  },

  initializeFileUpload: function () {
    var self = this;

    $('#fileupload').fileupload({
        url: "/api/upload/create",
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
          self.model.trigger("profile:updateWithPhotoId", result[0]);
          // in case there was a previous error
          self.$("#file-upload-alert").hide();
        },
        fail: function (e, data) {
          // notify the user that the upload failed
          var message = data.errorThrown;
          self.$('#file-upload-progress-container').hide();
          if (data.jqXHR.status == 413) {
            message = "The uploaded file exceeds the maximum file size.";
          }
          self.$("#file-upload-alert").html(message);
          self.$("#file-upload-alert").show();
        }
    });

  },

  updateProfileEmail: function(){
    var subject = 'Take A Look At This Profile',
        data = {
          profileTitle: this.model.get('title'),
          profileLink: window.location.protocol +
            "//" + window.location.host + "" + window.location.pathname,
          profileName: this.model.get('name'),
          profileLocation: this.model.get('location') ?
            this.model.get('location').name : '',
          profileAgency: this.model.get('agency') ?
            this.model.get('agency').name : '',
          i18n: i18n
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
  },

  initializeTags: function() {
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
      showTags: showTags
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
        target: 'task',
        handle: 'task',  // used in css id
        data: data.tasks.created
      });
      this.taskView.render();
      this.volView = new ProfileActivityView({
        model: this.model,
        el: '.task-activity-wrapper',
        target: 'task',
        handle: 'volTask',  // used in css id
        data: data.tasks.volunteered
      });
      this.volView.render();

    });
  },

  updatePhoto: function () {
    var self = this;
    this.model.on("profile:updatedPhoto", function (data) {
      //added timestamp to URL to force FF to reload image from server
      var url = '/api/user/photo/' + data.attributes.id + "?" + new Date().getTime();
      $("#project-header").css('background-image', "url('" + url + "')");
      $('#file-upload-progress-container').hide();
      // notify listeners of the new user image, but only for the current user
      if (self.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger("user:profile:photo:save", url);
      }
    });
  },

  initializeForm: function() {
    var self = this;

    this.listenTo(self.model, "profile:save:success", function (data) {
      // Bootstrap .button() has execution order issue since it
      // uses setTimeout to change the text of buttons.
      // make sure attr() runs last
      $("#submit").button('success');
      // notify listeners if the current user has been updated
      if (self.model.toJSON().id == window.cache.currentUser.id) {
        window.cache.userEvents.trigger("user:profile:save", data.toJSON());
      }

      setTimeout(function() { $("#profile-save, #submit").attr("disabled", "disabled"); },0);
      $("#profile-save, #submit").removeClass("btn-primary");
      $("#profile-save, #submit").addClass("btn-success");
      self.data.saved = true;
      Backbone.history.navigate('profile/' + self.model.toJSON().id, { trigger: true });

    });

    this.listenTo(self.model, "profile:save:fail", function (data) {
      $("#submit").button('fail');
    });
    this.listenTo(self.model, "profile:removeAuth:success", function (data, id) {
      self.render();
    });
    this.listenTo(self.model, "profile:input:changed", function (e) {
      $("#profile-save, #submit").button('reset');
      $("#profile-save, #submit").removeAttr("disabled");
      $("#profile-save, #submit").removeClass("btn-success");
      $("#profile-save, #submit").addClass("btn-c2");
    });
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
      type:        "location",
      selector:    "#location",
      multiple:    false,
      data:        modelJson.location,
      width:       "100%"
    });

    this.tagFactory.createTagDropDown({
      type:        "agency",
      selector:    "#company",
      multiple:    false,
      allowCreate: false,
      data:        modelJson.agency,
      width:       "100%",
    });
  },

  initializeTextArea: function () {
    if (this.md) { this.md.cleanup(); }
    this.md = new MarkdownEditor({
      data: this.model.toJSON().bio,
      el: ".markdown-edit",
      id: 'bio',
      placeholder: 'A short biography.',
      title: 'Biography',
      rows: 6
    }).render();
  },

  fieldModified: function (e) {

    //check that the name isn't a null string
    var $help = this.$("#name").closest(".form-group").find(".help-block");
    $help.toggle( this.$("#name").val() === "" );

    this.model.trigger("profile:input:changed", e);
  },

  profileCancel: function (e) {
    e.preventDefault();
    Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
  },

  profileSave: function (e) {
    e.preventDefault();
    $("#profile-form").submit();
  },

  profileSubmit: function (e) {
    e.preventDefault();

    // If the name isn't valid, don't put the save through
    if (validate({ currentTarget: '#name' })) {
      return;
    }

    $("#profile-save, #submit").button('loading');
    setTimeout(function() { $("#profile-save, #submit").attr("disabled", "disabled"); }, 0);

    var newTags = [].concat(
          $("#company").select2('data'),
          $("#tag_topic").select2('data'),
          $("#tag_skill").select2('data'),
          $("#location").select2('data')
        ),
        data = {
          name:  $("#name").val(),
          title: $("#title").val(),
          bio: $("#bio").val(),
          username: $("#profile-email").val()
        },
        email = this.model.get('username'),
        self = this,
        tags = _(newTags).chain()
          .filter(function(tag) {
            return _(tag).isObject() && !tag.context;
          })
          .map(function(tag) {
            return (tag.id && tag.id !== tag.name) ? +tag.id : {
              name: tag.name,
              type: tag.tagType,
              data: tag.data
            };
          }).unique().value();

    data.tags = tags;

    this.model.trigger("profile:save", data);
  },

  removeAuth: function (e) {
    if (e.preventDefault) e.preventDefault();
    var node = $(e.currentTarget);
    this.model.trigger("profile:removeAuth", node.data("service"));
  },

  like: function (e) {
    e.preventDefault();
    var self = this;
    var child = $(e.currentTarget).children("#like-button-icon");
    var likenumber = $("#like-number");
    // Not yet liked, initiate like
    if (child.hasClass('fa-star-o')) {
      child.removeClass('fa-star-o');
      child.addClass('fa fa-star');
      likenumber.text(parseInt(likenumber.text()) + 1);
      if (parseInt(likenumber.text()) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      $.ajax({
        url: '/api/like/likeu/' + self.model.attributes.id
      }).done( function (data) {
        // liked!
        // response should be the like object
        // console.log(data.id);
      });
    }
    // Liked, initiate unlike
    else {
      child.removeClass('fa-star');
      child.addClass('fa-star-o');
      likenumber.text(parseInt(likenumber.text()) - 1);
      if (parseInt(likenumber.text()) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      $.ajax({
        url: '/api/like/unlikeu/' + self.model.attributes.id
      }).done( function (data) {
        // un-liked!
        // response should be null (empty)
      });
    }
  },
  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    removeView(this);
  }

});

module.exports = ProfileShowView;
