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
        this.remoteGet(data);
      });

      this.listenTo(this, "task:update", function (data) {
        this.update(data);
      });

      this.listenTo(this, "task:update:state", function (state) {
        this.updateState(state);
      });

      this.listenTo(this, "task:update:orphan", function (data) {
        this.orphanTask(data);
      });
    },

    update: function (data) {
      var self = this;

      this.save(data, {
        success: function (data) {
          self.trigger("task:update:success", data);
        }
      });
    },

    updateState: function (state) {
      var self = this;

      this.save({
        state: state
      }, {
        success: function(data) {
          self.trigger("task:update:state:success", data);
        }
      });
    },

    orphanTask: function(data) {
      var self = this;

      this.save({
        projectId: null,
        description: data.description
      }, {
        success: function(data) {
          self.trigger("task:update:orphan:success", data);
        }
      });

    },

    remoteGet: function (id) {
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