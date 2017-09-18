var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../base/base_controller');
var BrowseMainView = require('../views/browse_main_view');
var TasksCollection = require('../../../entities/tasks/tasks_collection');
var ProfilesCollection = require('../../../entities/profiles/profiles_collection');
var TaskModel = require('../../../entities/tasks/task_model');
// var TaskFormView = require('../../tasks/new/views/task_form_view');
// var ModalWizardComponent = require('../../../components/modal_wizard');
// var ModalComponent = require('../../../components/modal');


var Browse = {};

Browse.ListController = BaseController.extend({

  events: {
    "click .link-backbone": linkBackbone,
    "click .add-opportunity": "addTask"
  },

  initialize: function(options) {
    // this.options = options;
    this.target = options.target;
    this.queryParams = options.queryParams || {};

    this.fireUpCollection();
    this.initializeView();
    this.collection.trigger('browse:' + this.target + ":fetch");
  },

  initializeView: function() {
    if (this.browseMainView) {
      this.browseMainView.cleanup();
    }
    this.browseMainView = new BrowseMainView({
      el: "#container",
      target: this.target,
      collection: this.collection,
      queryParams: this.queryParams
    }).render();
  },

  fireUpCollection: function() {
    var self = this;
    this.tasksCollection = new TasksCollection();
    this.profilesCollection = new ProfilesCollection();
    if (this.target == 'tasks') {
      this.collection = this.tasksCollection;
    } else {
      this.collection = this.profilesCollection;
    }
    this.listenToOnce(this.collection, 'browse:' + this.target + ":fetch", function() {
      self.collection.fetch({
        success: function(collection) {
          self.collection = collection;
          self.browseMainView.collection = collection;
          self.browseMainView.filter();
        }
      });
    });
  },

  // -----------------------
  //= BEGIN CLASS METHODS
  // -----------------------
  addTask: function() {
    Backbone.history.navigate('/tasks/new', { trigger: true });
  },

  // ---------------------
  //= UTILITY METHODS
  // ---------------------
  cleanup: function() {
    if (this.taskFormView) { this.taskFormView.cleanup(); }
    if (this.modalWizardComponent) { this.modalWizardComponent.cleanup(); }
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    if (this.browseMainView) { this.browseMainView.cleanup(); }
    removeView(this);
  }

});

module.exports = Browse.ListController;
