/**
 * Source definition for
 *
 * @module    :: audience.js
 * @description :: defines service functions that return collections of users
 */
module.exports = {
  execute: function (fields, settings, cb) {
    User.find({}).exec(cb);
  }
};
