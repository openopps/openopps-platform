const _ = require('lodash');
const validator = require('validator');
const Tag = require('./Tag');

module.exports = {
  create: (user) => {
    return _.extend({
      isAdmin: false,
      isAgencyAdmin: false,
      disabled: false,
      passwordAttempts: 0,
      completedTasks: 0,
    }, user);
  },

  validateUser: async (attributes, isURIUsed) => {
    var obj = {};
    var uriUsed = await isURIUsed(attributes.id, attributes.uri);
    obj['invalidAttributes'] = {};
    obj = validateURI(obj, uriUsed, attributes);
    obj = validateBio(obj, attributes);
    obj = validateName(obj, attributes);
    obj = validateTitle(obj, attributes);
    obj = validateTags(obj, attributes);
    return obj;
  },

  validateTags: validateTags,
};

function validateURI (obj, uriUsed, attributes) {
  if (uriUsed.length > 0) {
    obj['invalidAttributes']['email'] = [];
    obj['invalidAttributes']['email'].push({'message': 'A user with that email already exists (`' + attributes.uri + '`).'});
  }
  if (attributes.uri.match(/[<>]/g)) {
    if (_.isEmpty(obj['invalidAttributes']['email'])) {
      obj['invalidAttributes']['email'] = [];
    }
    obj['invalidAttributes']['email'].push({'message': 'Email must not contain the special characters < or >.'});
  }
  if (!validator.isEmail(attributes.uri)) {
    if (_.isEmpty(obj['invalidAttributes']['email'])) {
      obj['invalidAttributes']['email'] = [];
    }
    obj['invalidAttributes']['email'].push({'message': 'Email must be a valid email address.'});
  }
  if (attributes.uri.length > 60) {
    if (_.isEmpty(obj['invalidAttributes']['email'])) {
      obj['invalidAttributes']['email'] = [];
    }
    obj['invalidAttributes']['email'].push({'message': 'Email must not be greater than 60 characters.'});
  }
  return obj;
}

function validateBio (obj, attributes) {
  if (typeof attributes.bio !== 'undefined' && attributes.bio.match(/[<>]/g)) {
    obj['invalidAttributes']['bio'] = [];
    obj['invalidAttributes']['bio'].push({'message': 'Bio must not contain the special characters < or >.'});
  }
  return obj;
}

function validateName (obj, attributes) {
  if (typeof attributes.name == 'undefined') {
    obj['invalidAttributes']['name'] = [];
    obj['invalidAttributes']['name'].push({'message': 'Name is required.'});
    return obj;
  }
  if (attributes.name.match(/[<>]/g)) {
    obj['invalidAttributes']['name'] = [];
    obj['invalidAttributes']['name'].push({'message': 'Name must not contain the special characters < or >.'});
  }
  if (attributes.name.length > 60) {
    if (_.isEmpty(obj['invalidAttributes']['name'])) {
      obj['invalidAttributes']['name'] = [];
    }
    obj['invalidAttributes']['name'].push({'message': 'Name must not be greater than 60 characters.'});
  }
  return obj;
}

function validateTitle (obj, attributes) {
  if (typeof attributes.title !== 'undefined') {
    if (attributes.title.match(/[<>]/g)) {
      obj['invalidAttributes']['title'] = [];
      obj['invalidAttributes']['title'].push({'message': 'Title must not contain the special characters < or >.'});
    }
    if (attributes.title.length > 150) {
      if (_.isEmpty(obj['invalidAttributes']['title'])) {
        obj['invalidAttributes']['title'] = [];
      }
      obj['invalidAttributes']['title'].push({'message': 'Title must not be greater than 150 characters.'});
    }
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
