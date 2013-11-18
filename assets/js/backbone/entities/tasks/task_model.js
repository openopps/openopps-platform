define([
    'underscore',
    'backbone'
], function (_, Backbone) {
  'use strict';

  var TaskModel = Backbone.Model.extend({

    defaults: {
      name        : null,
      description : null
    },

    urlRoot: '/api/task',

    initialize: function () {
      this.listenTo(this, "task:save", function (data) {
        this.save();
      });

      this.listenTo(this, "task:model:fetch", function (data) {
        this.get(data);
      });

      this.listenTo(this, "task:update", function (data) {
        this.update(data);
      });
    },

    update: function (data) {
      var self = this;

      this.save(self, {
        projectId   : data['projectId'],
        title       : data['title'],
        description : data['description']
      }, {
        success: function (data) {
          console.log(data); }
      });
    },

    get: function (id) {
      var self = this;
      this.set({ id: id });
      this.fetch({
        success: function (data) {
          self.trigger("task:model:fetch:success", data);
        }
      });
    },

  });

    return TaskModel;
});