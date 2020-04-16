const _ = require('lodash');
const DateCodeGenerator = require('./dateCodeGenerator');

function TaskDecorator (task) {
  this.object = _.clone(task);

}

_.extend(TaskDecorator.prototype, {
  isAssigned: function () {
    return _.includes(['assigned', 'completed'], this.object.state);
  },

  isNotArchived: function () {
    return this.object.state != 'archived';
  },

  decorate: function (group) {
    _.each(['isAssigned', 'isNotArchived'], function (attr) {
      this.object[attr] = this[attr]();
    }.bind(this));
    this.addDateCodes(group);
    return this.object;
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