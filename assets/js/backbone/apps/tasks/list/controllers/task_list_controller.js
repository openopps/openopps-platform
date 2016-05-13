
var _ = require('underscore');
var Backbone = require('backbone');

var Bootstrap = require('bootstrap');
var TasksCollection = require('../../../../entities/tasks/tasks_collection');
var TaskCollectionView = require('../views/task_collection_view');
// var TaskFormView = require('../../new/views/task_form_view');
var ModalWizardComponent = require('../../../../components/modal_wizard');
var TaskModel = require('../../../../entities/tasks/task_model');

TaskList = Backbone.View.extend({

  el: "#task-list-wrapper",

  events: {
    'click .add-task' : 'add',
    'click .show-task': 'show',
    'click .task'     : 'show',
    'click .wizard'   : 'wizard'
  },

  initialize: function (settings) {
    this.options = _.extend(settings, this.defaults);
    var self = this;

    this.initializeTaskCollectionInstance();
    this.initializeTaskModelInstance();
    this.initializeListeners();
    this.requestTasksCollectionData();

    this.collection.on("tasks:render", function () {
      self.requestTasksCollectionData()
    })
  },

  initializeListeners: function() {
    var self = this;
    this.listenTo(this.taskModel, 'task:tags:save:success', function () {
      self.initializeTaskModelInstance();
      self.requestTasksCollectionData();
    });
  },

  initializeTaskModelInstance: function () {
    this.taskModel = new TaskModel();
  },

  initializeTaskCollectionInstance: function () {
    if (this.collection) {
      this.collection.initialize();
    } else {
      this.collection = new TasksCollection();
    }
  },

  requestTasksCollectionData: function () {
    var self = this;

    this.collection.fetch({
      url: '/api/task/findAllByProjectId/' + parseInt(this.options.projectId),
      success: function (collection) {
        self.tasks = collection;
        self.renderTaskCollectionView()
      }
    });
  },

  renderTaskCollectionView: function () {
    var self = this;

    this.listenTo(this.collection, "task:save:success", function (model) {
      self.requestTasksCollectionData();
    });

    if (this.taskCollectionView) this.taskCollectionView.cleanup();
    this.taskCollectionView = new TaskCollectionView({
      el: "#task-list-wrapper",
      onRender: true,
      collection: self.tasks
    });
  },

  add: function (e) {
    Backbone.history.navigate('/tasks/new', { trigger: true });
  },

  show: function (e) {
    if (e.preventDefault) e.preventDefault();
    var projectId = $(e.currentTarget).data('projectid'),
        taskId    = $(e.currentTarget).data('id');

    if (taskId == 'null') { return; }

    Backbone.history.navigate('tasks/' + taskId, { trigger: true }, taskId);
  },

  cleanup: function () {
    if (this.taskFormView) this.taskFormView.cleanup();
    if (this.modalWizardComponent) this.modalWizardComponent.cleanup();
    if (this.taskCollectionView) this.taskCollectionView.cleanup();
    removeView(this);
  }

});

module.exports = TaskList;
