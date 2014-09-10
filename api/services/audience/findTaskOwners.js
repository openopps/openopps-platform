/**
 * Source definition for
 *
 * @module    :: audience.js
 * @description :: defines service functions that return collections of users
 */
var _ = require('underscore');
var utils = require('./utils');

module.exports = {
  execute: function (fields, settings, cb) {
    Task.find({id: fields.taskId}).exec(function(err, owners){
      utils.convertToUsers(err, owners, cb);
    });
  }
};
