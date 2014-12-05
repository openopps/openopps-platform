define([
  'underscore',
  'backbone',
], function (_, Backbone) {

  var ProjectModel = Backbone.Model.extend({

    defaults: {
      title       : null,
      description : null,
      archived    : false
    },

    // Initialize contains only event bindings and if/then response
    // functions (class methods).
    initialize: function () {
      var self = this;

      this.listenTo(this, "project:model:fetch", function (id) {
        self.remoteGet(id);
      });

      this.listenTo(this, "project:model:update", function (data) {
        self.update(data);
      });

      this.listenTo(this, "project:update:photoId", function (file) {
        self.updatePhoto(file);
      });

      this.listenTo(this, "project:update:state", function (state) {
        self.updateState(state);
      });

      this.listenTo(this, "projectowner:show:changed", function (data) {
        self.updateOwners(data);
      });

      this.listenTo(this, "project:update:tasks:orphan", function (data) {
        self.orphan(data);
      });

    },

    urlRoot: '/api/project',

    remoteGet: function (id) {
      var self = this;
      this.set({ id: id });
      this.fetch({
        success: function (data) {
          self.trigger("project:model:fetch:success", data);
        }
      });
    },

    update: function (data) {
      var self = this;

      this.save({
        title: data['title'],
        description: data['description']
      }, { success: function (data) {
          self.trigger("project:save:success", data);
        }
      });
    },

    // TODO: Update this method and move it into the global update method.
    updatePhoto: function (file) {
      var self = this;

      this.save({
        coverId: file['id']
      }, {
        success: function (data) {
          self.trigger("project:updated:photo:success", data);
        }
      });
    },

    updateState: function (state) {
      var self = this;

      this.save({
        state: state
      }, {
        success: function(data) {
          self.trigger("project:update:state:success", data);
        }
      });
    },

    updateOwners: function (data) {
      var self = this;
      // console.log(data);
      this.save({
        owners: data
      }, {
        success: function(data) {
          self.trigger("project:update:owners:success", data);
        }
      });
    },

    hasOpenTasks: function(tasks){
      //takes a task collection object
      var hasOpenTasks = false;
      var self = this;
      var count = 0;

      _.each(tasks.models,function(task){
        if ( _.indexOf(['open','assigned'],task.attributes.state) != -1 ){
          hasOpenTasks = true;
          count++;
        }
      });

      return {hasOpenTasks:hasOpenTasks,count:count};
    },

    orphan: function(tasks) {
      //orphans associated tasks for a state change
      tasks.each(function(model){
        model.trigger("task:update:orphan",{});
      });
    }

  });

  return ProjectModel;
});