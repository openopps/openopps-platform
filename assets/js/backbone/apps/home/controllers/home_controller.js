define([
  'jquery',
  'underscore',
  'async',
  'backbone',
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
  'autocomplete'
], function ($, _, async, Backbone, utils, Popovers, BaseController, ProjectItemView, ProjectItemCoreMetaView, ProjectownerShowView, AttachmentView,
  TaskListController, EventListController, CommentListController, CommentFormView,
  ModalComponent, autocomplete) {

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
      this.listenTo(this.model, "project:model:fetch:success", function (model) {
        this.model = model;
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

    search: function () {
      $(".comment-content").midasAutocomplete({
        backboneEvents: true,
        // If we are using backbone here, then a lot of these
        // misc. AJAX options we are passing are unecessary.  So we should somehow
        // manage that in an elegant way.
        backbone: false,
        apiEndpoint: '/api/ac/inline',
        // the query param expects one api endpoint IE:
        // /nested/endpoint?QUERYPARAM=$(".search").val()
        // So it is not something that you can chain params onto.
        // It expects you to send the data back as input data through that query param
        // one character at a time.
        queryParam: 'q',
        type: 'POST',
        contentType: 'json',

        // The plugin will accept any trigger key'd in here, and then
        // use that to start the search process.  if it doesn't exist it will not search.
        trigger: "@",
        searchResultsClass: ".search-result-wrapper",

        success: function (data) {

        }
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
        $("#like-button-icon").removeClass('icon-star-empty');
        $("#like-button-icon").addClass('icon-star');
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

    stateClose: function (e) {
      if (e.preventDefault) e.preventDefault();
      this.model.trigger("project:update:state", 'closed');
    },

    stateReopen: function (e) {
      if (e.preventDefault) e.preventDefault();
      this.model.trigger("project:update:state", 'public');
    },

    like: function (e) {
      if (e.preventDefault) e.preventDefault();
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
          url: '/api/like/like/' + this.model.attributes.id
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
          url: '/api/like/unlike/' + this.model.attributes.id
        }).done( function (data) {
          // un-liked!
          // response should be null (empty)
        });
      }
    },

    delete: function (e) {
      if (e.preventDefault) e.preventDefault();
      var model, title;

      attr = $(e.currentTarget).closest(".project-title").children(".project").text();
      model = getCurrentModelFromFormAttributes(this.collection, attr);

      model.destroy();
      this.renderProjectCollectionView();
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