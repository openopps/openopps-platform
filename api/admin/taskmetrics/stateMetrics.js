const _ = require('lodash');

function StateMetrics (tasks) {
  this.tasks = tasks;
  this.publishedTasks= _.filter(this.tasks,function (task){
    return task.publishedAt;
  });
  this.completedTasks= _.filter(this.tasks,function (task){
    return task.completedAt;
  });
  this.canceledTasks= _.filter(this.tasks,function (task){
    return task.canceledAt;
  });
}

_.extend(StateMetrics.prototype, {
  publishedCount: function () {
    return _.chain(this.publishedTasks)
      .countBy(function (task) { return task.publishedAtCode;}.bind(this))
      .value();
  },

  completedCount: function () {
    return _.chain(this.completedTasks)
      .countBy(function (task) { return task.completedAtCode; }.bind(this))
      .value();
  },

  canceledCount: function () {
    return _.chain(this.canceledTasks)   
      .countBy(function (task) { return task.canceledAtCode; }.bind(this))
      .value();
  },

  completedByAdminCount: function () {
    return _.chain(this.completedTasks)
      .filter(function (task) { return task.updatedBy !== task.userId; })
      .countBy(function (task) { return task.completedAtCode; }.bind(this))
      .value();
  },

  range: function () {
    return _.keys(this.publishedCount() || {});
  },

  calculateCarryover: function () {
    var carryOver = {};
    var range = this.metrics && this.metrics.range;
    if (!range) { return carryOver; }

    _.each(range, function (dateCode) {
      carryOver[dateCode] = 0;
    });

    _.each(this.tasks, function (task) {
      _.each(range, function (dateCode) { 
        var wasOpen =   task.publishedAtCode < dateCode;  
        var notCompleted = task.isNotArchived && (!task.completedAt || task.completedAtCode > dateCode);
        if (wasOpen && notCompleted) {
          carryOver[dateCode] += 1;
        }
      });
    });
    return carryOver;
  },

  metrics: function () {
    var metrics = this.metrics = {tasks: {}};
    metrics.tasks.published = this.publishedCount();
    metrics.tasks.completed = this.completedCount();
    metrics.tasks.completedByAdmin = this.completedByAdminCount();
    metrics.tasks.canceled= this.canceledCount();
    metrics.range = this.range();
    metrics.tasks.carryOver = this.calculateCarryover();
    return metrics;
  },
});

module.exports = StateMetrics;