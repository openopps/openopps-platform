define([
	'jquery',
	'underscore',
	'backbone',
	'utilities',
	'async',
	'text!task_list_template'
], function ($, _, Backbone, utils, async, TaskListTemplate) {

	var TasksCollectionView = Backbone.View.extend({

		el: "#task-list-wrapper",

		initialize: function (options) {
			this.options = options;
			this.requestTagData();
		},

		requestTagData: function () {
			var self = this;

			this.tasksJson = {
				tasks: this.options.collection.toJSON(),
				user: window.cache.currentUser
			};

			var requestTagData = function (task, done) {
				$.ajax({
					url: '/api/tag/findAllByTaskId/' + task.id,
					async: false,
					success: function (tags) {
						task['tags'] = _.sortBy(tags, function (tag) { return tag.updateAt; }).reverse();
						done();
					},
					error: function () {
						task['tags'] = [];
						done();
					}
				});
			}

			async.each(this.tasksJson.tasks, requestTagData, function () {
				self.render();
			});

		},

		render: function () {
			this.compiledTemplate = _.template(TaskListTemplate, this.tasksJson);
			this.$el.html(this.compiledTemplate);

			return this;
		},

		cleanup: function () {
			removeView(this);
		}

	});

	return TasksCollectionView;
});