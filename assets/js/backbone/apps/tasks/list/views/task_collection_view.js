
var _ = require('underscore');
var Backbone = require('backbone');

var async = require('async');
var marked = require('marked');

var fs = require('fs');
var TaskListTemplate = fs.readFileSync(`${__dirname}/../templates/task_collection_view_template.html`).toString();


	var TasksCollectionView = Backbone.View.extend({

		el: "#task-list-wrapper",

		initialize: function (options) {
			this.options = options;
			this.tasksJson = {
				tasks: this.options.collection.toJSON(),
				user: window.cache.currentUser
			};

			this.render();
		},

		render: function () {
			_.each(this.tasksJson.tasks, function(task) {
				// Filter out "Required"/"Not Required" from the task tag cloud
				task.tags = _.filter(task.tags, function(tag) {
					return tag.type !== "task-skills-required";
				});
				task.description = marked(task.description);
			});
			this.compiledTemplate = _.template(TaskListTemplate)(this.tasksJson);
			this.$el.html(this.compiledTemplate);

			return this;
		},

		cleanup: function () {
			removeView(this);
		}

	});

	module.exports = TasksCollectionView;
