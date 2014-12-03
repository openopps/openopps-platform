define([
  'jquery',
  'underscore',
  'async',
  'backbone',
  'i18n',
  'utilities',
  'popovers',
  'base_controller',
  'project_item_view',
  'project_item_coremeta_view',
  'projectowner_show_view',
  'attachment_show_view',
  'task_list_controller',
  'event_list_controller',
  'comment_list_controller',
  'comment_form_view',
  'modal_component',
  'modal_alert',
  'task_model',
  'text!project_child_tasks_warning_template'
], function ($, _, async, Backbone, i18n, utils, Popovers, BaseController, ProjectItemView, ProjectItemCoreMetaView, ProjectownerShowView, AttachmentView,
  TaskListController, EventListController, CommentListController, CommentFormView,
  ModalComponent, ModalAlert, TaskModel, ProjectChildTasksWarningTemplate) {

  var popovers = new Popovers();

  Application.Project = {};

  Application.Project.ShowController = BaseController.extend({

    el: "#container",

    // Set the model to null, before it is fetched from the server.
    // This allows us to clear out the previous data from the list_view,
    // and get ready for the new data for the project show view.
    model: null,

    events: {
      "click #like-button"              : "like",
      "keyup .comment-content"          : "search",
      "click #tag-save"                 : "tagSave",
      "click #tag-create"               : "tagCreate",
      "click .tag-delete"               : "tagDelete",
      "click #project-close"            : "stateClose",
      "click #project-reopen"           : "stateReopen",
      'click #editProject'              : 'toggleEditMode',
      "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
      "click .project-people-div"       : popovers.popoverClick
    },

    // The initialize method is mainly used for event bindings (for effeciency)
    initialize: function (options) {
      var self = this;

      this.router = options.router;
      this.id = options.id;
      this.data = options.data;
      this.action = options.action;

      this.model.trigger("project:model:fetch", this.model.id);
      this.listenTo(this.model, "project:model:fetch:success", function (projectModel) {
        self.model = projectModel;
        if (self.action == 'edit') {
          var model = this.model.toJSON();
          // check if the user owns the task
          var owner = model.isOwner;
          if (owner !== true) {
            // if none of these apply, are they an admin?
            if (window.cache.currentUser) {
              if (window.cache.currentUser.isAdmin === true) {
                owner = true;
              }
            }
          }
          // if not the owner, trigger the login dialog.
          if (owner !== true) {
            window.cache.userEvents.trigger("user:request:login", {
              message: "You are not the owner of this project. <a class='link-backbone' href='/projects/" + model.id + "'>View the project instead.</a>",
              disableClose: true
            });
            return;
          }
        }
        self.initializeItemView();
      });

      this.model.on("project:show:rendered", function () {
        self.initializeItemCoreMetaView();
        self.initializeOwners();
        self.initializeItemViewControllers();
        self.initializeHandlers();
        self.initializeLikes();
        self.initializeUI();
      });
    },

    initializeItemView: function () {
      if (this.projectShowItemView) this.projectShowItemView.cleanup();
      this.projectShowItemView  = new ProjectItemView({
                                model: this.model,
                                action: this.action,
                                data: this.data
                              }).render();
    },

    initializeItemCoreMetaView: function () {
      if (this.projectShowItemCoreMetaView) this.projectShowItemCoreMetaView.cleanup();
      this.projectShowItemCoreMetaView  = new ProjectItemCoreMetaView({
                                model: this.model,
                                action: this.action,
                                data: this.data
                               }).render();
    },


    initializeOwners : function(){
      if (this.projectownerShowView) this.projectownerShowView.cleanup();
      this.projectownerShowView = new ProjectownerShowView({
                                model: this.model,
                                action: this.action,
                                data: this.data
                               }).render();
    },

    initializeItemViewControllers: function () {
      if (this.action != 'edit') {
        // Tasks
        if (this.taskListController) this.taskListController.cleanup();
        this.taskListController = new TaskListController({
          projectId: this.model.id
        });

        // Events
        if (this.eventListController) this.eventListController.cleanup();
        this.eventListController = new EventListController({
          projectId: this.model.id
        });
        // Comments
        if (this.commentListController) this.commentListController.cleanup();
        this.commentListController = new CommentListController({
          target: 'project',
          id: this.model.id
        });
        // Attachments
        if (this.attachmentView) this.attachmentView.cleanup();
        this.attachmentView = new AttachmentView({
          target: 'project',
          id: this.model.attributes.id,
          action: this.action,
          data: this.data,
          owner: this.model.attributes.isOwner,
          el: '.attachment-wrapper'
        }).render();
      }
    },

    initializeLikes: function() {
      $("#like-number").text(this.model.attributes.likeCount);
      if (parseInt(this.model.attributes.likeCount) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      if (this.model.attributes.like) {
        $("#like-button-icon").removeClass('fa-star-o');
        $("#like-button-icon").addClass('fa fa-star');
      }
    },

    initializeHandlers: function() {
      this.listenTo(this.model, "project:update:state:success", function (data) {
        if (data.attributes.state == 'closed') {
          $("#li-project-close").hide();
          $("#li-project-reopen").show();
          $("#alert-closed").show();
        } else {
          $("#li-project-close").show();
          $("#li-project-reopen").hide();
          $("#alert-closed").hide();
        }
      });
    },

    initializeUI: function() {
      popovers.popoverPeopleInit(".project-people-div");
    },

    toggleEditMode: function(e){
      if (e.preventDefault) e.preventDefault();
      var action = '';
      if (!(this.action && this.action == 'edit')) {
        action = '/edit';
      }
      Backbone.history.navigate('projects/' + this.id + action, { trigger: true });
    },

    orphanTasksFromProject: function(projectId) {

      this.taskListController.collection.each(function(model){
        model.trigger("task:update:orphan",{description:model.description});
      });
    },

    hasOpenChildTasks: function(projectId, count) {
      var hasOpenChildTasks = false;
      var self = this;
      self.openTasks = 0;

      _.each(this.taskListController.collection.models,function(task){
        if ( _.indexOf(['open','assigned'],task.attributes.state) != -1 ){
          hasOpenChildTasks = true;
          self.openTasks++;
        }
      });

      return hasOpenChildTasks;
    },

    stateClose: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      if (this.modalAlert) { this.modalAlert.cleanup(); }
      if (this.modalComponent) { this.modalComponent.cleanup(); }
      this.modalComponent = new ModalComponent({
        el: "#modal-close",
        id: "check-close",
        modalTitle: "Close "+i18n.t("Project")
      }).render();

      var count = 0;
      if ( this.hasOpenChildTasks(this.id, count) ){
        var modalContent = _.template(ProjectChildTasksWarningTemplate,{count: self.openTasks});
        var submitLabel = "I Understand and Want to Close This "+i18n.t("Project");
      } else {
        var modalContent = '<p>Are you sure you want to close this '+i18n.t("project")+'?  Once the '+i18n.t("project")+' is closed, participants will no longer be able to contribute.</p>';
        var submitLabel = "Close "+i18n.t("Project");
      }

      this.modalAlert = new ModalAlert({
        el: "#check-close .modal-template",
        modalDiv: '#check-close',
        content: modalContent,
        cancel: 'Cancel',
        submit: submitLabel,
        callback: function (e) {
          // user clicked the submit button
          if ( self.hasOpenChildTasks(this.id ) ) { self.orphanTasksFromProject(this.id); }
          self.model.trigger("project:update:state", 'closed');
          self.initializeItemView();
        }
      }).render();
    },

    stateReopen: function (e) {
      if (e.preventDefault) e.preventDefault();
      this.model.trigger("project:update:state", 'open');
    },

    like: function (e) {
      if (e.preventDefault) e.preventDefault();
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
          url: '/api/like/like/' + this.model.attributes.id
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
          url: '/api/like/unlike/' + this.model.attributes.id
        }).done( function (data) {
          // un-liked!
          // response should be null (empty)
        });
      }
    },

    // ---------------------
    //= Utility Methods
    // ---------------------
    cleanup: function() {
      if (this.projectShowItemCoreMetaView) this.projectShowItemCoreMetaView.cleanup();
      if (this.taskListController) this.taskListController.cleanup();
      if (this.eventListController) this.eventListController.cleanup();
      if (this.commentListController) this.commentListController.cleanup();
      if (this.projectShowItemView) this.projectShowItemView.cleanup();
      if (this.projectownerShowView) this.projectownerShowView.cleanup();
      if (this.attachmentView) this.attachmentView.cleanup();
      removeView(this);
    }

  });

  return Application.Project.ShowController;
});