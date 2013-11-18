define([
  'jquery',
  'underscore',
  'backbone',
  'text!task_edit_form_template'
], function ($, _, Backbone, TaskEditFormTemplate) {

  var TaskEditFormView = Backbone.View.extend({

    events: {
      'submit #task-edit-form': 'edit'
    },

    el: ".main-section",

    render: function () {
      var self = this,
          data = {
            data: self.model
          },
          compiledTemplate;

      compiledTemplate = _.template(TaskEditFormTemplate, data);
      this.$el.html(compiledTemplate);
    },

    edit: function (e) {
      if (e.preventDefault) e.preventDefault();

      var data = {
        title: $("#task-edit-form-title").val(),
        description: $("#task-edit-form-description").val()
      }

      this.model.trigger("task:model:update", data);
    }

  });

  return TaskEditFormView;
})