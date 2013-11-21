define([
  'bootstrap',
  'popovers',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'base_view',
  'text!task_show_template'
], function (Bootstrap, Popovers, _, Backbone, async, utlities, BaseView, TaskShowTemplate) {

  var TaskItemView = BaseView.extend({

    el: "#container",

    initialize: function (options) {
      var self = this;
      this.model.trigger("task:model:fetch", this.options.id);
      this.listenTo(this.model, "task:model:fetch:success", function (model) {
        self.model = model;
        self.getTagData();
        self.render();
      });
    },

    getTagData: function () {
      var self = this;

      $.ajax({
        url: '/api/tag/findAllByTaskId/' + self.options.id,
        async: false,
        success: function (data) {
          self.tags = [];
          for (var i = 0; i < data.length; i += 1) {
            self.tags.push(data[i]);
          }
        }
      });

      // Build object for render
      this.data = { model: self.model.toJSON(), tags: this.tags };
      this.data['madlibTags'] = organizeTags(self.tags);
    },

    render: function () {
      var self = this;

      this.initializeSelect2Data();

      var compiledTemplate = _.template(TaskShowTemplate, this.data);
      $(self.el).html(compiledTemplate)
    },

    initializeSelect2Data: function () {
      var self = this,
          types = ["skillsRequired", "timeRequired", "people", "length", "timeEstimates"];

      this.tagSources = {};

      var requestAllTagsByType = function (type) {
        $.ajax({
          url: '/api/ac/tag?type=' + type + '&list',
          type: 'GET',
          async: false,
          success: function (data) {
            // Dynamically create an associative
            // array based on that for the pointer to the list itself to be iterated through
            // on the front-end.
              self.tagSources[type] = data;
          }
        });
      }

      async.each(types, requestAllTagsByType, function (err) {
        self.render();
      });
    }
  });

  return TaskItemView;
})