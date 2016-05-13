/**
 * UserPasswordReset
 *
 * @module      :: Model
 * @description :: Reset tokens for allowing a user to reset their password
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var uuid = require('node-uuid');

module.exports = {

  attributes: {

    // User that has requested the password reset
    userId: 'INTEGER',
    // Generated token, valid for a period of time
    token: 'STRING'

  },
  beforeCreate: function (values, cb) {
    sails.log.verbose('UserPasswordReset.beforeCreate', values);
    // generate a unique token based on uuid
    values.token = uuid.v4();
    cb(null, values);
  },

  afterCreate: function(model, done) {
    sails.log.verbose('just created UserPasswordReset', model);
    Notification.create({
      action: 'userpasswordreset.create.token',
      model: model
    }, done);
  },

  /**
   * Check if a token is a valid token for resetting a user's password.
   *
   * @return cb of the form (err, true if valid, token object)
   */
  checkToken: function (token, cb) {
    token = token.toLowerCase().trim();
    // compute the maximum token expiration time
    var expiry = new Date();
    expiry.setTime(expiry.getTime() - sails.config.auth.local.tokenExpiration);
    UserPasswordReset.find()
    .where({ token: token })
    .where({ createdAt:
      {
        '>': expiry
      }
    })
    .exec(function (err, tokens) {
      if (err) { return cb(err, false, null); }
      var valid = false;
      var validToken = null;
      for (var i in tokens) {
        if (tokens[i].token == token) {
          valid = true;
          validToken = tokens[i];
          break;
        }
      }
      cb(null, valid, validToken);
    });
  },

};
