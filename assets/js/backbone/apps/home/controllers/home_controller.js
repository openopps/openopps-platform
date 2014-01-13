define([
  'jquery',
  'underscore',
  'async',
  'backbone',
  'utilities',
  'base_controller',
  'home_view',
], function ($, _, async, Backbone, utils, BaseController, HomeView) {


  Application.Home.Controller = BaseController.extend({

    el: "#container",

    // The initialize method is mainly used for event bindings (for effeciency)
    initialize: function (options) {
      var self = this;
      this.router = options.router;
      this.id = options.id;
      this.data = options.data;
      this.action = options.action;
	  self.initializeHomeView();
      });

    },

    initializeHomeView: function () {
      if (this.homeView) this.homeView.cleanup();
      this.homeView  = new homeView({
                                action: this.action,
                                data: this.data
                              }).render();
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

  return Application.Project.Controller;
});