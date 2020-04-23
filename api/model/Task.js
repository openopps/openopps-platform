const _ = require('lodash');
const validator = require('validator');
const Tag = require('./Tag');

module.exports = {
  create: (task) => {
    return _.extend({
      state: openopps.taskState || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, task);
  },
  getOwnerId: function (task) {
    var id = (typeof task.owner === 'object') ? task.owner.id : task.owner;
    return id;
  },
  isOpen: function (task) {
    if (_.indexOf(['open', 'public', 'assigned'], task.state) != -1) {
      return true;
    }
    return false;
  },

  isClosed: function (task) {
    if (_.indexOf(['closed', 'archived', 'completed'], task.state) != -1) {
      return true;
    }
    return false;
  },

  authorized: function (task, user) {
    task.isOwner = false;
    if (user && (this.getOwnerId(task) == user.id)) {
      task.isOwner = true;
      return task;
    }
    if (user && user.isAdmin) {
      return task;
    }
    if ((task.state !== 'draft') && (task.state !== 'submitted')) {
      return task;
    }
    return null;
  },

  validateOpportunity: async (attributes) => {
    var obj = {};
    obj['invalidAttributes'] = {};
    obj = validateCompletedBy(obj, attributes);
    obj = validateTitle(obj, attributes);
    obj = validateDescription(obj, attributes);
    obj = validateTags(obj, attributes);
    return obj;
  },
};

function validateCompletedBy (obj, attributes) {
  if (attributes.completedBy && (!validator.isISO8601(attributes.completedBy) || attributes.completedBy.match(/[<>]/g))) {
    obj['invalidAttributes']['completedby'] = [];
    obj['invalidAttributes']['completedby'].push({'message': 'Estimated completion date must be a date.'});
  }
  return obj;
}

function validateTitle (obj, attributes) {
  if (typeof attributes.title == 'undefined' || attributes.title == '') {
    obj['invalidAttributes']['title'] = [];
    obj['invalidAttributes']['title'].push({'message': 'Headline is required.'});
    return obj;
  }
  if (attributes.title.match(/[<>]/g)) {
    obj['invalidAttributes']['title'] = [];
    obj['invalidAttributes']['title'].push({'message': 'Headline must not contain the special characters < or >.'});
  }
  if (attributes.title.length > 100) {
    if (_.isEmpty(obj['invalidAttributes']['title'])) {
      obj['invalidAttributes']['title'] = [];
    }
    obj['invalidAttributes']['title'].push({'message': 'Headline must not be greater than 100 characters.'});
  }
  return obj;
}

function validateDescription (obj, attributes) {
  if (typeof attributes.description == 'undefined' || attributes.description == '') {
    obj['invalidAttributes']['description'] = [];
    obj['invalidAttributes']['description'].push({'message': 'Description is required.'});
    return obj;
  }
  if (attributes.description.match(/[<>]/g)) {
    obj['invalidAttributes']['description'] = [];
    obj['invalidAttributes']['description'].push({'message': 'Description must not contain the special characters < or >.'});
  }
  return obj;
}

function validateTags (obj, attributes) {
  if (typeof attributes.tags !== 'undefined') {
    (attributes.tags || attributes['tags[]'] || []).map(async (tag) => {
      if(!_.isNumber(tag)) {
        if (!Tag.IsValidTagType(tag.type)) {
          obj['invalidAttributes']['tag'] = [];
          obj['invalidAttributes']['tag'].push({'message': 'Invalid tag type (`' + tag.type + '`).'});
        } else if (tag.name.match(/[<>]/g)) {
          obj['invalidAttributes']['tag'] = [];
          obj['invalidAttributes']['tag'].push({'message': 'Tags must not contain the special characters < or >.'});
        }
      }
    });
  }
  return obj;
}
