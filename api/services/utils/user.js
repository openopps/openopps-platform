var _ = require('underscore');
var validator = require('validator');
var async = require('async');
// TODO var tagUtils = require('./tag');

module.exports = {
  /**
   * Clean fields from a user object that might
   * be sensitive.
   * @param user the user object to clean
   * @return a new user object
   */
  cleanUser: function (user, reqId) {
    var u = {
          id: user.id,
          username: user.username,
          name: user.name,
          title: user.title,
          bio: user.bio,
          tags: user.tags,
          badges: user.badges,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
      };
    // if the requestor is the same as the user, show admin status
    if (user.id === reqId) {
      u.isAdmin = user.isAdmin;
    }
    return u;
  },

  /**
   * Look up the name of a user and include it in the originating object.
   * The user's name is stored in the originating object.
   * @param user an object that includes userId for the user
   * @param done called when finished with syntax done(err).
   */
  addUserName: function (ownerObj, done) {
    User.findOneById(ownerObj.userId, function (err, owner) {
      if (err) { return done(err); }
      if (!owner) { return done(); }
      ownerObj.name = owner.name;
      return done();
    });
  },

  /**
   * Validate a password based on OWASP password rules.
   * @param username the user's name or email
   * @param password the user's proposed password
   * @return an object returning keys set to true where the rule passes,
   *         false if the rule failed.
   */
  validatePassword: function (username, password) {
    var rules = {
      username: false,
      length: false,
      upper: false,
      lower: false,
      number: false,
      symbol: false
    };
    var _username = username.toLowerCase().trim();
    var _password = password.toLowerCase().trim();
    // check username is not the same as the password, in any case
    if (_username != _password && _username.split('@',1)[0] != _password) {
      rules.username = true;
    }
    // length > 8 characters
    if (password && password.length >= 8) {
      rules.length = true;
    }
    // Uppercase, Lowercase, and Numbers
    for (var i = 0; i < password.length; i++) {
      var test = password.charAt(i);
      // from http://stackoverflow.com/questions/3816905/checking-if-a-string-starts-with-a-lowercase-letter
      if (test === test.toLowerCase() && test !== test.toUpperCase()) {
        // lowercase found
        rules.lower = true;
      }
      else if (test === test.toUpperCase() && test !== test.toLowerCase()) {
        rules.upper = true;
      }
      // from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
      else if (!isNaN(parseFloat(test)) && isFinite(test)) {
        rules.number = true;
      }
    }
    // check for symbols
    if (/.*[^\w\s].*/.test(password)) {
      rules.symbol = true;
    }
    return rules;
  }
};
