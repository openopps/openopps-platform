// vendor libraries
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');
var jqIframe = require('blueimp-file-upload/js/jquery.iframe-transport');
var jqFU = require('blueimp-file-upload/js/jquery.fileupload.js');

// internal dependencies
var UIConfig = require('../../../../config/ui.json');
var User = require('../../../../../utils/user');

// templates
var ProfilePhotoTemplate = require('../templates/profile_photo_template.html');

var ProfilePhotoView = Backbone.View.extend({

  events: {
    'click #photo-remove': 'removePhoto',
  },

  initialize: function (options) {
    this.$el = $(options.el);
    this.options = options;
    this.model = this.options.data;

    this.model.on('profile:updatedPhoto', function (data) {
      this.render();
    }.bind(this));
  },

  render: function () {
    var data = {
      ui: UIConfig,
      data: this.model.attributes,
    };

    var template = _.template(ProfilePhotoTemplate)(data);
    this.$el.html(template);
    this.$el.localize();

    // initialize file upload component
    this.initializeFileUpload();

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

  initalizeOnUpdatePhoto: function () {
    
  },

  removePhoto: function () {
    $.ajax({
      url: '/api/user/photo/remove/' + this.model.attributes.id,
      type: 'POST',
      data: {
        id: this.model.attributes.id,
      },
    }).done(function ( data ) {
      this.model.attributes.photoId = undefined;
      this.render();
    }.bind(this));
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = ProfilePhotoView;

