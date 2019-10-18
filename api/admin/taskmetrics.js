const _ = require('lodash');
const async = require('async');
const log = require('log')('app:admin:taskmetrics');

var TaskDecorator =           require(__dirname + '/taskmetrics/taskDecorator');
var StateMetrics =            require(__dirname + '/taskmetrics/stateMetrics');
var VolunteerMetrics =  require(__dirname + '/taskmetrics/volunteerMetrics');

function TaskMetrics (tasks,volunteers,group, filter) {
  this.tasks = tasks;
  this.volunteers = volunteers; 
  this.filter = filter;
  this.group = group;
  this.metrics = {};
}

_.extend(TaskMetrics.prototype, {
  generateMetrics: function (done) {
    this.done = done;
    this.getTasks();
  },

  getTasks: function () {
    tasks = this.filterTasks(this.tasks);
    this.tasks = this.decorateTasks(tasks);
    this.createMetrics();
  },

  filterTasks: function (tasks) {
    if (this.filter) {
      var filter = this.filter;
      tasks = _.filter(tasks, function (task) {
        return _.find(task.tags, { name: filter });
      });
    }
    return tasks;
  },

  decorateTasks: function (tasks) {
    var group = this.group;
    return _.map(tasks, function (task) {
      var decorator = new TaskDecorator(task);
      return decorator.decorate(group);
    });
  },

  createMetrics: function () {
    async.parallel([
      this.generateStateMetrics.bind(this),
      this.generateVolunteerMetrics.bind(this),
    ], this.done);
  },

  generateStateMetrics: function (next) {
    var stateMetrics = new StateMetrics(this.tasks, this.group);
    _.extend(this.metrics, stateMetrics.metrics());
    next();
  },

  generateVolunteerMetrics: function (next) {
    var generator = new VolunteerMetrics(this.volunteers,this.tasks,this.group); 
    generator.calculate(function () {
      _.extend(this.metrics, generator.metrics);
      next();
    }.bind(this));
  },
});

module.exports = TaskMetrics;