/**
 * Source definition for
 *
 * @module    :: utils.js
 * @description :: Utilities for audience finders
 */
var _ = require('underscore');

module.exports = {
  /**
   * Convenience function that accepts a collection of entities
   * with a property "userId" (must be exact) and returns a collection of those users
   * @param err any upstream error that occurred (immediately calls cb(err))
   * @param userIdPropertyCollection models that have a .userId attribute
   * @param cb callback function with format (err, userArray)
   */
  convertToUsers: function (err, userIdPropertyCollection, cb) {
    var uIds = [];
    if (err) {
      return cb(err, []);
    }
    _.each(userIdPropertyCollection, function (item) {
      uIds.push(item.userId);
    });
    if (uIds.length > 0) {
      User.find({
        where: { id: uIds }
      }).exec(cb);
    }
    else {
      cb(null, []);
    }
  }
};
