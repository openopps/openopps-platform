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
    Comment.findOneById(fields.commentId).exec(function (err, comment) {
      if(!err && comment){
        // get all parent comments
        sails.services.utils['comment'].commentParentThreadAssemble(comment, {}, function (err, comments){
          if(!err){
            utils.convertToUsers(err, comments, cb);
          }
          else {
            cb(err, []);
          }
        });
      }
      else {
        cb(err, []);
      }
    });
  }
};
