var _ = require('underscore');

function StateMetrics(tasks) {
  this.tasks = tasks;
}

_.extend(StateMetrics.prototype, {
  publishedCount: function() {
    return _.chain(this.tasks)
      .filter(function(task) { return task.isPublished;})
      .countBy(function(task) { return task.publishedAtCode;}.bind(this))
      .value();
  },

  completedCount: function() {
    return _.chain(this.tasks)
      .filter(function(task) { return task.isCompleted; })
      .countBy(function(task) { return task.completedAtCode; }.bind(this))
      .value();
  },

  range: function() {
    return _.keys(this.publishedCount() || {});
  },

  calculateCarryover: function() {
    var carryOver = {};
    var range = this.metrics && this.metrics.range;
    if (!range) { return carryOver; }

    _.each(range, function(dateCode) {
      carryOver[dateCode] = 0;
    });

    _.each(this.tasks, function(task) {
      _.each(range, function(dateCode) {
        var wasOpen =   task.publishedAtCode < dateCode;
        var openAfter = task.isNotArchived && (!task.completedAt || task.completedAtCode > dateCode);

        if (wasOpen && openAfter) {
          carryOver[dateCode] += 1;
        }
      });
    });

    return carryOver;
  },

  metrics: function() {
    var metrics = this.metrics = {tasks: {}};
    metrics.tasks.published = this.publishedCount();
    metrics.tasks.completed = this.completedCount();
    metrics.range = this.range();
    metrics.tasks.carryOver = this.calculateCarryover();
    return metrics;
  }
});

module.exports = StateMetrics;

