var _ = require('underscore');
var DateCodeGenerator = require(__dirname + "/dateCodeGenerator");

function TaskDecorator(task) {
  this.object = _.clone(task);
}

_.extend(TaskDecorator.prototype, {
  isPublished: function() {
    return _.include(['open', 'assigned', 'completed'], this.object.state);
  },

  isAssigned: function() {
    return _.include(['assigned', 'completed'], this.object.state);
  },

  isCompleted: function() {
    return _.include(['completed'], this.object.state);
  },

  isNotArchived: function() {
    return this.object.state != 'archived';
  },

  decorate: function(group) {
    this.normalizeDates();
    _.each(['isPublished', 'isAssigned', 'isCompleted', 'isNotArchived'], function(attr) {
      this.object[attr] = this[attr]();
    }.bind(this));
    this.addDateCodes(group);
    return this.object;
  },

  normalizeDates: function() {
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
  },

  addDateCodes: function(group) {
    var generator = new DateCodeGenerator(group);
    this.object.createdAtCode = generator.create(this.object.createdAt);
    this.object.assignedAtCode = generator.create(this.object.assignedAt);
    this.object.publishedAtCode = generator.create(this.object.publishedAt);
    this.object.completedAtCode = generator.create(this.object.completedAt);
  }
});

module.exports = TaskDecorator;

