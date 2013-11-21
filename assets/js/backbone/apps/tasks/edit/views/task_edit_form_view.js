define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!task_edit_form_template'
], function ($, _, Backbone, utilities, TaskEditFormTemplate) {

  var TaskEditFormView = Backbone.View.extend({

    el: ".main-section",

    events: {
      'submit #task-edit-form': 'submit'
    },

    viewEvents: function () {
      var self = this;
      $(".show-task").on('click', function (e) {
        self.returnToTaskShowPage();
      });
    },

    initialize: function (options) {
      this.options = options;
      if (this.options.edit) {
        // Sync out of scope events and DOM elements.
        this.syncOutOfScopeDomElements();
        this.viewEvents();
      }
    },

    syncOutOfScopeDomElements: function () {
      $(".edit-task").removeClass("edit-task").addClass("show-task");
      $(".show-task > i > strong").text("Show");
    },

    returnToTaskShowPage: function () {
      alert("You will lose all saved data if you continue without submitting");
      Backbone.history.navigate('tasks/' + this.options.taskId, { trigger: true }, this.options.taskId);
    },

    render: function () {

      var self = this,
          compiledTemplate;

      $.ajax({
        url: '/api/tag/findAllByTaskId/' + self.model.id,
        async: false,
        success: function (res, text, xhr) {
          self.tags = [];
          for (var i = 0; i < res.length; i += 1) {
            self.tags.push(res[i]);
          }
        }
      });

      this.data = { data: this.model }
      this.data['madlibTags'] = organizeTags(this.tags);

      compiledTemplate = _.template(TaskEditFormTemplate, this.data);
      this.$el.html(compiledTemplate);

      // DOM now exists, begin select2 init
      this.initializeSelect2();
    },

    initializeSelect2: function () {

      var formatResult = function (object, container, query) {
        return object.name;
      };

      $("#location").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        data: [ location ],
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'location',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#skills-required").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'skillRequired',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#time-required").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'time-required',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#time-estimate").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'time-estimate',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#length").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'length',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#topics").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'topic',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#people").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'people',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      $("#skills").select2({
        formatResult: formatResult,
        formatSelection: formatResult,
        minimumInputLength: 1,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: 'skill',
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

    },

    submit: function (e) {
      if (e.preventDefault) e.preventDefault();

      var tags = [
        $("#topics").select2('data'),
        $("#skills").select2('data'),
        $("#skills-required").select2('data'),
        $("#people").select2('data'),
        $("#time-required").select2('data'),
        $("#length").select2('data'),
        // $("#time-estimate").select2('data'),
        // $("#task-location").select2('data'),
        $("#input-specific-location").val(),
      ];

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

      var data = {
        title: $("#task-edit-form-title").val(),
        description: $("#task-edit-form-description").val()
      }

      this.model.trigger("task:model:update", data);
    },

    initTaskTags: function (tags) {
      var self = this,
          tagMap;

      var removeTag = function (type, done) {
        if (self.model[type]) {

          if (self.model[type].tagId) {
            return done();
          }

          $.ajax({
            url: '/api/tag/' + self.model[type].tagId,
            type: 'DELETE',
            success: function (data) {
              return done();
            }
          });

          return;
        } return done();
      };

      var addTag = function (tag, done) {
        if (!tag || !tag.id) {
          return done();
        }

        tagMap = {
          tagId: tag.id,
          taskId: this.model.id
        }

        $.ajax({
          url: '/api/tag',
          type: 'POST',
          data: tagMap
        }).done(function (data) {
          done();
        });
      }

      async.each(tags, addTag, function (err) {
        return self.model.trigger("task:tags:save:success", err);
      });

      this.listenTo(self.model, "task:tags:save:success", function (data) {
        Backbone.history.navigate('taskShow', { trigger: true })
      });
    }

  });

  return TaskEditFormView;
})