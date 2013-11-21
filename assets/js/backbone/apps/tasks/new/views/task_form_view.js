define([
    'jquery',
    'bootstrap',
    'underscore',
    'backbone',
    'async',
    'utilities',
    'tasks_collection',
    'text!task_form_template',
    'tag_show_view'
], function ($, Bootstrap, _, Backbone, async, utilities, TasksCollection, TaskFormTemplate, TagShowView) {

	var TaskFormView = Backbone.View.extend({

		el: "#task-list-wrapper",

		events: {
      "click .wizard-submit"  : "post",
      "change #task-location" : "locationChange"
		},

		initialize: function () {
			this.options = _.extend(this.options, this.defaults);
      this.tasks = this.options.tasks;
      this.initializeSelect2Data();
		},

    initializeSelect2Data: function () {
      var self = this,
          types = ["skills-required", "time-required", "people", "length", "time-estimates"];

      this.tagSources = {};

      var requestAllTagsByType = function (type) {
        $.ajax({
          url: '/api/ac/tag?type=' + type + '&list',
          type: 'GET',
          async: false,
          success: function (data) {
            // Dynamically take the hyphen delimited type (if more than 1 word) and
            // camelize it like the template expects.  Then create an associative
            // array based on that for the pointer to the list itself to be iterated through
            // on the front-end.
            var typeArray = type.split("-");
            if (typeArray.length > 1) {
              typeArray[typeArray.length - 1] = typeArray[typeArray.length - 1].charAt(0).toUpperCase() + typeArray[typeArray.length - 1].substr(1).toLowerCase();
              self.tagSources[typeArray.join("")] = data;
            } else {
              self.tagSources[type] = data;
            }
          }
        });
      }

      async.each(types, requestAllTagsByType, function (err) {
        self.render();
      });
    },

		render: function () {
      var template = _.template(TaskFormTemplate, this.tagSources)
			this.$el.html(template);
      this.initializeSelect2();

      // Important: Hide all non-currently opened sections of wizard.
      // TODO: Move this to the modalWizard js.
      $("section:not(.current)").hide();
		},

    post: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      var taskData = {
        title       : $("#task-title").val(),
        projectId   : this.options.projectId,
        description : $("#task-description").val()
      };

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

      this.listenTo(this.tasks, "task:save:success", function (taskId) {

        var addTag = function (tag, done) {
          if (!tag || !tag.id) return done();
          if (tag.tagId) return done();

          var tagMap = {
            taskId: taskId,
            tagId: tag.id
          }

          $.ajax({
            url: '/api/tag',
            type: 'POST',
            data: tagMap,
            success: function (data) {
              done();
            },
            error: function (err) {
              throw new Error("error");
            }
          });
        }

        async.each(tags, addTag, function (err) {
          return self.model.trigger("task:tags:save:success", err);
        });

      });

    },


    initializeSelect2: function () {
      var self = this;

      var formatResult = function (obj, container, query) {
        return obj.name;
      };

      // ------------------------------ //
      //  DROP DOWNS REQUIRING A FETCH  //
      // ------------------------------ //
      $("#skills").select2({
        placeholder: "skills",
        formatResult: formatResult,
        width: '220px',
        multiple: true,
        formatSelection: formatResult,
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
            return { results: data }
          }
        }
      });

      // Topics select 2
      $("#topics").select2({
        placeholder: "topics",
        formatResult: formatResult,
        formatSelection: formatResult,
        multiple: true,
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
            return { results: data }
          }
        }
      });

      // ------------------------------ //
      // PRE-DEFINED SELECT MENUS BELOW //
      // ------------------------------ //
      $("#skills-required").select2({
        placeholder: "required/not-required",
        width: '200px'
      });

      $("#time-required").select2({
        placeholder: 'time-required',
        width: '130px'
      });

      $("#people").select2({
        placeholder: 'people',
        width: '150px'
      });

      $("#length").select2({
        placeholder: 'length',
        width: '130px'
      });

      $("#time-estimate").select2({
        placeholder: 'time-estimate',
        width: '200px'
      });

      $("#task-location").select2({
        placeholder: 'length',
        width: '130px'
      });

      // $("#skills-required").select2({
      //   placeholder: "required/not-required",
      //   width: '130px'
      // });

      // $("#time-required").select2({
      //   width: '130px'
      // });

      // $("#people").select2({
      //   width: '130px'
      // });

      // $("#length").select2({
      //   width: '130px'
      // });

      // $("#time-estimate").select2({
      //   width: '200px'
      // });

      // $("#task-location").select2();
    },

    locationChange: function (e) {
      if (_.isEqual(e.currentTarget.value, "a specific location")) {
        $(".el-specific-location").show();
      } else if (!_.isEqual(e.currentTarget.value, "a specific location")) {
        $(".el-specific-location").hide();
      }
    },

    cleanup: function () {
      removeView(this);
    }

	});

	return TaskFormView;

});
