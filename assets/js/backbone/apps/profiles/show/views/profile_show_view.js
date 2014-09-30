define([
  'jquery',
  'async',
  'jquery_iframe',
  'jquery_fileupload',
  'underscore',
  'backbone',
  'utilities',
  'markdown_editor',
  'marked',
  'tag_show_view',
  'text!profile_show_template',
  'text!profile_email_template',
  'json!login_config',
  'modal_component',
  'profile_activity_view',
  'profile_email_view',
  'tag_factory'
], function ($, async, jqIframe, jqFU, _, Backbone, utils, MarkdownEditor, marked,
  TagShowView, ProfileTemplate, EmailTemplate, Login, ModalComponent, PAView, EmailFormView, TagFactory) {

  var ProfileShowView = Backbone.View.extend({

    events: {
      "submit #profile-form"       : "profileSubmit",
      "click #profile-save"        : "profileSave",
      "click .link-backbone"       : linkBackbone,
      "click #profile-cancel"      : "profileCancel",
      "click #like-button"         : "like",
      "keyup #name, #title, #bio"  : "fieldModified",
      "click #add-email"           : "addEmail",
      "click .email-remove"        : "removeEmail",
      "click .removeAuth"          : "removeAuth"
    },

    initialize: function (options) {
      this.options = options;
      this.data = options.data;
      this.tagFactory = new TagFactory();
      this.data.newItemTags = [];
      this.edit = false;
      if (this.options.action == 'edit') {
        this.edit = true;
      }
      if (this.data.saved) {
        this.saved = true;
        this.data.saved = false;
      }
    },

    render: function () {
      var data = {
        login: Login,
        data: this.model.toJSON(),
        user: window.cache.currentUser || {},
        edit: this.edit,
        saved: this.saved
      }
      if (data.data.bio) {
        data.data.bioHtml = marked(data.data.bio);
      }
      var template = _.template(ProfileTemplate, data);
      this.$el.html(template);

      // initialize sub components
      this.initializeFileUpload();
      this.initializeForm();
      this.initializeSelect2();
      this.initializeLikes();
      this.initializeTags();
      this.initializePAView();
      this.initializeEmail();
      this.initializeTextArea();
      this.updatePhoto();
      this.updateProfileEmail();
      return this;
    },

    initializeFileUpload: function () {
      var self = this;

      $('#fileupload').fileupload({
          url: "/api/file/create",
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
            // for IE8/9 that use iframe
            if (data.dataType == 'iframe text') {
              var result = JSON.parse(data.result);
            }
            // for modern XHR browsers
            else {
              var result = JSON.parse($(data.result).text());
            }
            self.model.trigger("profile:updateWithPhotoId", result[0]);
          },
          fail: function (e, data) {
            // notify the user that the upload failed
            var message = data.errorThrown;
            self.$('#file-upload-progress-container').hide();
            if (data.jqXHR.status == 413) {
              message = "The uploaded file exceeds the maximum file size.";
            }
            self.$("#file-upload-alert").html(message)
            self.$("#file-upload-alert").show();
          }
      });

    },

    updateProfileEmail: function(){
      var self = this;
      $.ajax({
        url: '/api/email/makeURL?email=contactUserAboutProfile&subject=Check Out "'+ self.model.attributes.name + '"' +
        '&profileTitle=' + (self.model.attributes.title || '') +
        '&profileLink=' + window.location.protocol + "//" + window.location.host + "" + window.location.pathname +
        '&profileName=' + (self.model.attributes.name || '') +
        '&profileLocation=' + (self.model.attributes.location ? self.model.attributes.location.tag.name : '') +
        '&profileAgency=' + (self.model.agency ? self.model.agency.name : ''),
        type: 'GET'
      }).done( function (data) {
        self.$('#email').attr('href', data);
      });
    },

    initializeTags: function() {
      if (this.tagView) { this.tagView.cleanup(); }
      this.tagView = new TagShowView({
        model: this.model,
        el: '.tag-wrapper',
        target: 'profile',
        targetId: 'userId',
        edit: this.edit,
        url: '/api/tag/findAllByUserId/'
      });
      this.tagView.render();
    },

    initializePAView: function () {
      if (this.projectView) { this.projectView.cleanup(); }
      if (this.taskView) { this.taskView.cleanup(); }
      if (this.volView) { this.volView.cleanup(); }
      $.ajax('/api/user/activities/' + this.model.attributes.id).done(function (data) {
        this.projectView = new PAView({
          model: this.model,
          el: '.project-activity-wrapper',
          target: 'project',
          data: data.projects
        });
        this.projectView.render();
        this.taskView = new PAView({
          model: this.model,
          el: '.task-createdactivity-wrapper',
          target: 'task',
          data: data.tasks
        });
        this.taskView.render();
        this.volView = new PAView({
          model: this.model,
          el: '.task-activity-wrapper',
          target: 'task',
          data: data.volTasks
        });
        this.volView.render();

      });
    },

    updatePhoto: function () {
      var self = this;
      this.model.on("profile:updatedPhoto", function (data) {
        var url = '/api/user/photo/' + data.attributes.id;
        // force the new image to be loaded
        $.get(url, function (data) {
          $("#project-header").css('background-image', "url('" + url + "')");
          $('#file-upload-progress-container').hide();
          // notify listeners of the new user image, but only for the current user
          if (self.model.toJSON().id == window.cache.currentUser.id) {
            window.cache.userEvents.trigger("user:profile:photo:save", url);
          }
        });
      });
    },

    initializeForm: function() {
      var self = this;

      $("#topics").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });

      $("#skills").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });

      this.listenTo(self.model, "profile:save:success", function (data) {
        // Bootstrap .button() has execution order issue since it
        // uses setTimeout to change the text of buttons.
        // make sure attr() runs last
        $("#submit").button('success');
        // notify listeners if the current user has been updated
        if (self.model.toJSON().id == window.cache.currentUser.id) {
          window.cache.userEvents.trigger("user:profile:save", data.toJSON());
        }

        var tags = [
          $("#company").select2('data'),
          $("#location").select2('data')
        ];
        self.model.trigger("profile:tags:save", tags);
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

          // if a different profile is being edited, add its userId
          if (self.model.toJSON().id !== window.cache.currentUser.id) {
            tagMap.userId = self.model.toJSON().id;
          }

        async.forEach(
          tags,
          function(tag, callback){
            //diffAdd,self.model.attributes.id,"taskId",callback
            return self.tagFactory.addTag(tag,tagMap.userId,"userId",callback);
          },
          function(err){
            self.model.trigger("profile:tags:save:success", err);
          }
        );
      });

        this.listenTo(self.model, "profile:tags:save", function (tags) {

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


        var removeTag = function(type, done) {
          if (self.model[type]) {
            // delete the existing tag
            $.ajax({
              url: '/api/tag/' + self.model[type].tagId,
              type: 'DELETE',
            }).done(function (data) {
              return done();
            });
            return;
          }
          return done();
        }

        var addTag = function (tag, done) {
          // the tag is invalid or hasn't been selected
          if (!tag || !tag.id) {
            return done();
          }
          // the tag already is stored in the db
          if (tag.tagId) {
            return done();
          }
          var tagMap = {
            tagId: tag.id
          };
          // if a different profile is being edited, add its userId
          if (self.model.toJSON().id !== window.cache.currentUser.id) {
            tagMap.userId = self.model.toJSON().id;
          }
          $.ajax({
            url: '/api/tag',
            type: 'POST',
            data: tagMap
          }).done(function (data) {
            done();
          });
        }

        async.each(['agency','location'], removeTag, function (err) {
          async.forEach(tags, addTag, function (err) {
            return self.model.trigger("profile:tags:save:success", err);  
          });
        });
      });

      this.listenTo(self.model, "profile:tags:save:success", function (err) {
        setTimeout(function() { $("#profile-save, #submit").attr("disabled", "disabled") }, 10);
        $("#profile-save, #submit").removeClass("btn-primary");
        $("#profile-save, #submit").addClass("btn-success");
        self.data.saved = true;
        setTimeout(function(){
          Backbone.history.navigate('profile/' + self.model.toJSON().id, { trigger: true });
        },100);
        
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

    initializeLikes: function() {
      $("#like-number").text(this.model.attributes.likeCount);
      if (parseInt(this.model.attributes.likeCount) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      if (this.model.attributes.like) {
        $("#like-button-icon").removeClass('icon-star-empty');
        $("#like-button-icon").addClass('icon-star');
      }
    },

    initializeSelect2: function () {
      var self = this;

      var formatResult = function (object, container, query) {
        return object.name;
      };

      var modelJson = this.model.toJSON();
      $("#company").select2({
        placeholder: 'Select an Agency',
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 2,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'agency',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });
      if (modelJson.agency) {
        $("#company").select2('data', modelJson.agency.tag);
      }

      $("#topics").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });

      $("#skills").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });

      $("#company").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });
      $("#location").select2({
        placeholder: 'Select a Location',
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        data: [ location ],
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'location',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });
      if (modelJson.location) {
        $("#location").select2('data', modelJson.location.tag);
      }
      $("#location").on('change', function (e) {
        self.model.trigger("profile:input:changed", e);
      });
    },

    initializeEmail: function () {
      var modelJson = this.model.toJSON();
      if (this.edit) {
        for (var i in modelJson.emails) {
          var template = _.template(EmailTemplate, { email: modelJson.emails[i] });
          $("#profile-emails").append(template);
        }
      }
      // New tags added in to the DB via the modal
      this.model.listenTo(this.model, "profile:email:new", function (data) {
        // Destory modal
        $(".modal").modal('hide');
        // Add tag into the data list
        var template = _.template(EmailTemplate, { email: data });
        $("#profile-emails").append(template);
      });

      this.model.listenTo(this.model, "profile:email:error", function (data) {
        // nothing to be done
      });

      this.listenTo(this.model, "profile:email:delete", function (e) {
        $(e.currentTarget).parents('div.radio').remove();
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
      $("#profile-save, #submit").button('loading');
      setTimeout(function() { $("#profile-save, #submit").attr("disabled", "disabled") }, 0);
      var data = {
        name: $("#name").val(),
        title: $("#title").val(),
        bio: $("#bio").val()
      };
      this.model.trigger("profile:save", data);
      //this.render();
    },

    removeAuth: function (e) {
      if (e.preventDefault) e.preventDefault();
      var node = $(e.target);
      // walk up the tree until we get to the marked node
      while (!(node.hasClass("removeAuth"))) {
        node = node.parent();
      }
      this.model.trigger("profile:removeAuth", node.attr("id"));
    },

    addEmail: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      // Pop up dialog box to create tag,
      // then put tag into the select box
      if (this.emailFormView) this.emailFormView.cleanup();
      if (this.emailModalComponent) this.emailModalComponent.cleanup();
      this.emailModalComponent = new ModalComponent({
        el: "#emailModal",
        id: "addEmail",
        modalTitle: "Add Email Address"
      }).render();
      this.emailFormView = new EmailFormView({
        el: "#addEmail .modal-template",
        model: self.model,
        target: 'profile'
      });
      this.emailFormView.render();
    },

    removeEmail: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;
      // Get the data-id of the currentTarget
      // and then call HTTP DELETE on that tag id
      $.ajax({
        url: '/api/useremail/' + $(e.currentTarget).data('id'),
        type: 'DELETE',
      }).done(function (data) {
        self.model.trigger("profile:email:delete", e);
      });

    },

    like: function (e) {
      e.preventDefault();
      var self = this;
      var child = $(e.currentTarget).children("#like-button-icon");
      var likenumber = $("#like-number");
      // Not yet liked, initiate like
      if (child.hasClass('icon-star-empty')) {
        child.removeClass('icon-star-empty');
        child.addClass('icon-star');
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
        child.removeClass('icon-star');
        child.addClass('icon-star-empty');
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
      if (this.projectView) { this.projectView.cleanup(); }
      if (this.taskView) { this.taskView.cleanup(); }
      if (this.volView) { this.volView.cleanup(); }
      removeView(this);
    },

  });

  return ProfileShowView;
});
