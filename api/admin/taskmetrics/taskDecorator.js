const _ = require('lodash');
const DateCodeGenerator = require('./dateCodeGenerator');

function TaskDecorator (task) {
  this.object = _.clone(task);
}

_.extend(TaskDecorator.prototype, {
  isPublished: function () {
    return _.includes(['open', 'assigned', 'completed'], this.object.state);
  },

  isAssigned: function () {
    return _.includes(['assigned', 'completed'], this.object.state);
  },

  isCompleted: function () {
    return _.includes(['completed'], this.object.state);
  },
  isCanceled: function () {
    return _.includes(['canceled'], this.object.state);
  },

  isNotArchived: function () {
    return this.object.state != 'archived';
  },

  decorate: function (group) {
    this.normalizeDates();
    _.each(['isPublished', 'isAssigned', 'isCompleted', 'isNotArchived','isCanceled'], function (attr) {
      this.object[attr] = this[attr]();
    }.bind(this));
    this.addDateCodes(group);
    return this.object;
  },

  normalizeDates: function () {
    var createdAt = this.object.createdAt;
    if (!this.object.publishedAt && this.isPublished()) {
      this.object.publishedAt = createdAt;
    }

    if (!this.object.assignedAt && this.isAssigned()) {
      this.object.assignedAt = createdAt;
    }

    if (!this.object.completedAt && this.isCompleted()) {
      this.object.completedAt = createdAt;
    }
    if (!this.object.canceledAt && this.isCanceled()) {
      this.object.canceledAt = createdAt;
    }
  },

  addDateCodes: function (group) {
    var generator = new DateCodeGenerator(group);
    this.object.createdAtCode = generator.create(this.object.createdAt);
    this.object.assignedAtCode = generator.create(this.object.assignedAt);
    this.object.publishedAtCode = generator.create(this.object.publishedAt);
    this.object.completedAtCode = generator.create(this.object.completedAt);
    this.object.canceledAtCode = generator.create(this.object.canceledAt);
  },
});

module.exports = TaskDecorator;