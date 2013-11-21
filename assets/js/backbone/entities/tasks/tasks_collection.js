define([
  'underscore',
  'backbone',
  'task_model'
], function (_, Backbone, TaskModel) {
  'use strict';

  var TasksCollection = Backbone.Collection.extend({

    model: TaskModel,

    parse: function (response) {
      if (response) {
        if (response.tasks) {
          return response.tasks;
        }
        return response;
      }
      return [];
    },

    url: '/api/task',

    initialize: function () {
      var self = this;

      this.listenTo(this, "task:save", function (data) {
        self.addAndSave(data);
      })
    },

    addAndSave: function (data) {
      var self = this;

      self.task = new TaskModel({
        title: data['title'],
        projectId: data['projectId'],
        description: data['description']
      });

      self.task.save(null,{
        success: function (model) {
          self.trigger("task:save:success", self.task.id);
        }
      });

      entities.request.trigger("tasks:fetch", data['projectId']);
      this.trigger("tasks:render")
    }

  });

  return TasksCollection;
});