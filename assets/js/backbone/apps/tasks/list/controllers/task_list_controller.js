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
          collection.each(function(task){
            //console.log(task.attributes.state);
            if ( task.attributes.state == "public" ){ task.attributes.state = "open"; }
          });
          self.tasks = collection;
          self.renderTaskCollectionView()
        }
      });
    },

    renderTaskCollectionView: function () {
      var self = this;

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

      if (this.taskFormView) this.taskFormView.cleanup();
      if (this.modalWizardComponent) this.modalWizardComponent.cleanup();
      this.modalWizardComponent = new ModalWizardComponent({
        el: ".wrapper-addTask",
        id: "addTask",
        modalTitle: 'New Opportunity',
        model: self.taskModel,
        collection: self.tasks,
        modelName: 'task',
        data: function (parent) { return {
          title: parent.$("#task-title").val(),
          description: parent.$("#task-description").val(),
          projectId: self.options.projectId
        } }
      }).render();

      this.taskFormView = new TaskFormView({
        el: ".modal-body",
        projectId: this.options.projectId,
        model: self.taskModel,
        tasks: self.tasks
      }).render();
      this.modalWizardComponent.setChildView(this.taskFormView);
      this.modalWizardComponent.setNext(this.taskFormView.childNext);
      this.modalWizardComponent.setSubmit(this.taskFormView.childNext);
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

  return Application.Controller.TaskList;
});
