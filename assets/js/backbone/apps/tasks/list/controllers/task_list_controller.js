define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'bootstrap',
  'tasks_collection',
  'task_collection_view',
  'task_form_view',
  'modal_wizard_component',
  'task_model'
], function ($, _, Backbone, Utilities, Bootstrap, TasksCollection, TaskCollectionView, TaskFormView, ModalWizardComponent, TaskModel) {
  Application.Controller.TaskList = Backbone.View.extend({

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
      this.requestTasksCollectionData();

      this.collection.on("tasks:render", function () {
        self.requestTasksCollectionData()
      })
    },

    initializeTaskModelInstance: function () {
      if (this.taskModel) {
        this.taskModel.remove();
      }
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

      $(".modal-backdrop").hide();
      $(".modal").modal('hide');
      $("body").removeClass("modal-open")

      if (this.taskCollectionView) this.taskCollectionView.cleanup();
      this.taskCollectionView = new TaskCollectionView({
        el: "#task-list-wrapper",
        onRender: true,
        collection: self.tasks
      });
    },

    add: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      if (this.modalWizardComponent) this.modalWizardComponent.cleanup();
      this.modalWizardComponent = new ModalWizardComponent({
        el: "#task-list-wrapper",
        id: "addTask",
        modalTitle: 'New Opportunity',
        model: self.taskModel,
        collection: self.tasks,
        modelName: 'task',
        data: {
          title: $("#task-title").val(),
          description: $("#task-description").val(),
          projectId: self.options.projectId
        }
      }).render();

      if (!_.isUndefined(this.modalWizardComponent)) {
        if (this.taskFormView) this.taskFormView.cleanup();
        this.taskFormView = new TaskFormView({
          el: ".modal-body",
          projectId: this.options.projectId,
          model: self.taskModel,
          tasks: self.tasks
        }).render();
      }

    },

    show: function (e) {
      if (e.preventDefault) e.preventDefault();
      var projectId = $(e.currentTarget).data('projectid'),
          taskId    = $(e.currentTarget).data('id');

      if (taskId == 'null') { return; }

      Backbone.history.navigate('tasks/' + taskId, { trigger: true }, taskId);
    },

    cleanup: function () {
      if (this.taskCollectionView) this.taskCollectionView.cleanup();
      removeView(this);
    }

  });

  return Application.Controller.TaskList;
})