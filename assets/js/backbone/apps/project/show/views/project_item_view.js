define([
  'jquery',
  'jquery_iframe',
  'jquery_fileupload',
  'jquery_select2',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'text!project_show_template',
  'tag_show_view',
  'tag_factory'
], function ($, jqIframe, jqFU, select2, _, Backbone, async, utils, ProjectShowTemplate, TagShowView,TagFactory) {

  var ProjectShowView = Backbone.View.extend({

    el: "#container",

    events: {
    },

    initialize: function (options) {
      this.options = options;
      this.data = options.data;
      this.action = options.action;
      this.edit = false;
      if (this.options.action) {
        if (this.options.action == 'edit') {
          this.edit = true;
        }
      }
      this.tagFactory = new TagFactory();
      this.data.newItemTags = [];
    },

    render: function () {
      var compiledTemplate;
      var data = {
        hostname: window.location.hostname,
        data: this.model.toJSON(),
        user: window.cache.currentUser || {},
        edit: this.edit
      };

      compiledTemplate = _.template(ProjectShowTemplate, data);
      this.$el.html(compiledTemplate);

      this.initializeToggle();
      this.initializeTagFactory();
      this.initializeFileUpload();
      this.initializeTags();
      this.updatePhoto();
      this.updateProjectEmail();
      this.model.trigger("project:show:rendered");

      return this;
    },

    updatePhoto: function () {
      this.listenTo(this.model, "project:updated:photo:success", function (data) {
        var model = data.toJSON(), url;
        if (model.coverId) {
          url = '/api/file/get/' + model.coverId;
          $("#project-header").css('background-image', "url(" + url + ")");
        }
        $('#file-upload-progress-container').hide();
      });
    },

    updateProjectEmail: function() {
      var self = this;
      $.ajax({
        url: '/api/email/makeURL?email=contactUserAboutProject&subject=Check Out "'+ self.model.attributes.title + '"' +
        '&projectTitle=' + self.model.attributes.title +
        '&projectLink=' + window.location.protocol + "//" + window.location.host + "" + window.location.pathname +
        '&projectDescription=' + (self.model.attributes.description || ''),
        type: 'GET'
      }).done( function (data) {
        self.$('#email').attr('href', data);
      });

    },

    initializeTagFactory: function() {
      var self = this;

      this.listenTo(self.model, "project:tag:update:start", function (tags) {

        var newTags = [];
        newTags = newTags.concat(self.$("#tag_topic").select2('data'),self.$("#tag_skill").select2('data'),self.$("#tag_location").select2('data'),self.$("#tag_agency").select2('data'));

        async.forEach(
          newTags,
          function(newTag, callback) {
            return self.tagFactory.addTagEntities(newTag,self,callback);
          },
          function(err) {
            if (err) return next(err);
            self.trigger("newTagSaveDone");
          }
        );
      });

      self.on('newTagSaveDone',function (){

        tags         = [];
        var tempTags = [];

        //get newly created tags from big three types
        _.each(self.data.newItemTags, function(newItemTag){
          tags.push(newItemTag);
        });

        tempTags.push.apply(tempTags,self.$("#tag_topic").select2('data'));
        tempTags.push.apply(tempTags,self.$("#tag_skill").select2('data'));
        tempTags.push.apply(tempTags,self.$("#tag_location").select2('data'));
        tempTags.push.apply(tempTags,self.$("#tag_agency").select2('data'));

        //see if there are any previously created big three tags and add them to the tag array
        _.each(tempTags,function(tempTag){
            if ( tempTag.id !== tempTag.name ){
            tags.push(tempTag);
          }
        });

        var tagMap = {};
        var projectId = self.model.attributes.id;

        async.forEach(
          tags,
          function(tag, callback){
            return self.tagFactory.addTag(tag,projectId,"projectId",callback);
          },
          function(err){
            self.model.trigger("project:tags:save:success", err);
          }
        );
      });
    },

    initializeToggle: function () {
      if(this.edit){
        this.$('#editProject').find('.box-icon-text').html('View Project');
      }
      else{
        this.$('#editProject').find('.box-icon-text').html('Edit Project');
      }
    },

    initializeTags: function () {
      this.tagView = new TagShowView({
        model: this.model,
        el: '.tag-wrapper',
        target: 'project',
        targetId: 'projectId',
        edit: this.edit,
        url: '/api/tag/findAllByProjectId/'
      });
      this.tagView.render();
    },

    initializeFileUpload: function () {
      var self = this;

      $('#fileupload').fileupload({
          url: "/api/file/create",
          dataType: 'text',
          acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
          formData: { 'type': 'image' },
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
            // for IE8/9 that use iframe
            if (data.dataType == 'iframe text') {
              var result = JSON.parse(data.result);
            }
            // for modern XHR browsers
            else {
              var result = JSON.parse($(data.result).text());
            }
            self.model.trigger("project:update:photoId", result[0]);
          },
          fail: function (e, data) {
            // notify the user that the upload failed
            var message = data.errorThrown;
            self.$('#file-upload-progress-container').hide();
            if (data.jqXHR.status == 413) {
              message = "The uploaded file exceeds the maximum file size.";
            }
            self.$(".file-upload-alert").html(message)
            self.$(".file-upload-alert").show();
          }
      });

    },

    cleanup: function () {
      if (this.tagView) { this.tagView.cleanup(); }
      removeView(this);
    },
  });

  return ProjectShowView;
});