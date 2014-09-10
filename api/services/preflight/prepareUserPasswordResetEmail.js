/**
 * Source definition for preparing delivery of notifications (preflight)
 *
 * @module    :: preflight.js
 * @description :: defines service methods for delivery preflights
 */
var _ = require('underscore');
var userUtils = require('../utils/user');

module.exports = {
  // don't modify delivery content
  execute: function (fields, settings, cb) {
    var content = {};
    // set all default global locals for email
    content.fields = _.extend({}, sails.services.utils.emailTemplate['generateEmailLocals'](settings.emailName));
    content.fields.metadata = sails.services.utils.emailTemplate['addGlobals'](fields.metadata || {});
    // look up primary email address for this user
    userUtils.findPrimaryEmail(fields.recipientId, function (err, userEmail) {
      if (err) { sails.log.debug(err); cb(null, content); return false; }
      if (userEmail) {
        content.fields.to = userEmail.email;
      }
      else {
        content.fields.to = null;
      }
      // store userEmail object as metadata
      content.fields.metadata.userEmail = userEmail;
      // Get the reset token
      UserPasswordReset.findOneById(fields.callerId).exec(function (err, token) {
        if (err) { sails.log.debug(err); cb(null, content); return false; }
        content.fields.metadata.token = token;
        content.fields.from = sails.config['systemEmail'];
        content.fields.subject = _.template(content.fields.subject, content.fields.metadata);
        content.fields.templateLocals = content.fields.templateLocals || {};
        content.fields.templateLocals.token = token.token;
        content.fields.templateLocals.link = content.fields.metadata.globals.urlPrefix + '/profile/reset/' + token.token;
        cb(err, content);
      });
    });
  }
};
