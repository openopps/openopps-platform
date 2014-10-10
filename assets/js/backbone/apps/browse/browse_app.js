define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'nav_view',
  'footer_view',
  'browse_list_controller',
  'project_model',
  'project_show_controller',
  'profile_show_controller',
  'task_model',
  'task_show_controller',
  'task_edit_form_view',
  'admin_main_controller',
  'home_controller'
], function ($, _, Backbone, utils, NavView, FooterView, BrowseListController,
  ProjectModel, ProjectShowController, ProfileShowController, TaskModel,
  TaskShowController, TaskEditFormView, AdminMainController, HomeController) {

  var BrowseRouter = Backbone.Router.extend({

    routes: {
      ''                   : 'showHome',
      'projects(/)'               : 'listProjects',
      'projects/:id(/)'           : 'showProject',
      'projects/:id/:action(/)'   : 'showProject',
      'tasks(/)'                  : 'listTasks',
      'tasks/:id(/)'              : 'showTask',
      'tasks/:id/:action(/)'      : 'showTask',
      'profile(/)'                : 'showProfile',
      'profile/:id(/)'            : 'showProfile',
      'profile/:id(/)/:action'    : 'showProfile',
      'admin(/)'                  : 'showAdmin',
      'admin(/):action(/)'        : 'showAdmin'
    },

    data: { saved: false },

    initialize: function () {
      this.navView = new NavView({
        el: '.navigation'
      }).render();
      this.footerView = new FooterView({
        el: '#footer'
      }).render();
    },

    cleanupChildren: function () {
      if (this.browseListController) { this.browseListController.cleanup(); }
      if (this.projectShowController) { this.projectShowController.cleanup(); }
      if (this.profileShowController) { this.profileShowController.cleanup(); }
      if (this.taskShowController) { this.taskShowController.cleanup(); }
      if (this.homeController) { this.homeController.cleanup(); }
      this.data = { saved: false };
    },

    showHome: function () {
      this.cleanupChildren();
      this.homeController = new HomeController({target: 'home', el: '#container', router: this, data: this.data });
    },

    listProjects: function () {
      this.cleanupChildren();
      this.browseListController = new BrowseListController({
        target: 'projects',
        el: '#container',
        data: this.data
      });
    },

    listTasks: function () {
      this.cleanupChildren();
      this.browseListController = new BrowseListController({
        target: 'tasks',
        el: '#container',
        data: this.data
      });
    },

    showProject: function (id, action) {
      this.cleanupChildren();
      var model = new ProjectModel();
      model.set({ id: id });
      this.projectShowController = new ProjectShowController({ model: model, router: this, id: id, action: action, data: this.data });
    },

    showTask: function (id, action) {
      this.cleanupChildren();
      var model = new TaskModel();
      model.set({ id: id });
      this.taskShowController = new TaskShowController({ model: model, router: this, id: id, action: action, data: this.data });
    },

    showProfile: function (id, action) {
      this.cleanupChildren();
      // normalize input
      if (id) {
        id = id.toLowerCase();
      }
      if (action) {
        action = action.toLowerCase();
      }
      // normalize actions that don't have ids
      if (!action && id) {
        if (id == 'edit') {
          action = id;
          id = window.cache.currentUser.id;
        }
        else if (id == 'settings') {
          action = id;
          id = window.cache.currentUser.id;
        }
      }
      this.profileShowController = new ProfileShowController({ id: id, action: action, data: this.data });
    },

    showAdmin: function (action) {
      this.cleanupChildren();
      this.adminMainController = new AdminMainController({
        el: "#container",
        action: action
      });
    }

  });

  var initialize = function () {
    var router = new BrowseRouter();
    return router;
  }

  return {
    initialize: initialize
  };
});
