
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../../mixins/utilities');
var NavView = require('../nav/views/nav_view');
var FooterView = require('../footer/views/footer_view');
var BrowseListController = require('./controllers/browse_list_controller');
var ProjectModel = require('../../entities/projects/project_model');
var ProjectShowController = require('../project/show/controllers/project_show_controller');
var ProfileShowController = require('../profiles/show/controllers/profile_show_controller');
var TaskModel = require('../../entities/tasks/task_model');
var TaskShowController = require('../tasks/show/controllers/task_show_controller');
var TaskEditFormView = require('../tasks/edit/views/task_edit_form_view');
var AdminMainController = require('../admin/controllers/admin_main_controller');
var HomeController = require('../home/controllers/home_controller');
var MapController = require('../map/controllers/map_controller');


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
    'admin(/):action(/)'        : 'showAdmin',
    'map(/)'                    : 'showMap'
  },

  data: { saved: false },

  initialize: function () {
    this.navView = new NavView({
      el: '.navigation'
    }).render();
    this.footerView = new FooterView({
      el: '#footer'
    }).render();

    // set navigation state
    this.on('route', function(route, params) {
      var href = window.location.pathname;
      $('.navigation .nav-link')
        .closest('li')
        .removeClass('active');
      $('.navigation .nav-link[href="' + href + '"]')
        .closest('li')
        .addClass("active");
    });
  },

  cleanupChildren: function () {
    if (this.browseListController) { this.browseListController.cleanup(); }
    if (this.projectShowController) { this.projectShowController.cleanup(); }
    if (this.profileShowController) { this.profileShowController.cleanup(); }
    if (this.taskShowController) { this.taskShowController.cleanup(); }
    if (this.mapController) { this.mapController.cleanup(); }
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

  showMap: function () {
    this.cleanupChildren();
    this.mapController = new MapController({target: 'map', el: '#container', router: this, data: this.data });
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

module.exports = {
  initialize: initialize
};
