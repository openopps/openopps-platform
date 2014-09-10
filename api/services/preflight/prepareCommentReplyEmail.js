/**
 * Source definition for preparing delivery of notifications (preflight)
 *
 * @module    :: preflight.js
 * @description :: defines service methods for delivery preflights
 */
var _ = require('underscore');
var userUtils = require('../utils/user');
var commentUtils = require('../utils/comment');

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
      // Get the comment object
      Comment.findOneById(fields.callerId).exec(function (err, callComment) {
        if (err) { sails.log.debug(err); cb(null, content); return false; }
        content.fields.metadata.comment = callComment;
        // Get the initiator userId
        content.fields.initiatorId = callComment.userId;
        // Get the parent comment object
        Comment.findOneById(callComment.parentId).exec(function (err, parComment) {
          if (err) { sails.log.debug(err); cb(null, content); return false; }
          content.fields.metadata.parentComment = parComment;
          // Get information about the user who created the comment
          User.findOneById(callComment.userId).exec(function (err, user) {
            if (err) { sails.log.debug(err); cb(null, content); return false; }
            content.fields.metadata.commentUser = user;
            // Get information about the project or task
            var model = Project;
            var modelName = 'project';
            var modelId = callComment.projectId;
            if (callComment.taskId) {
              model = Task;
              modelName = 'task';
              modelId = callComment.taskId;
            }
            model.findOneById(modelId).exec(function (err, obj) {
              if (err) { sails.log.debug(err); cb(null, content); return false; }
              content.fields.metadata[modelName] = obj;
              if (obj) {
                content.fields.from = sails.config['systemEmail'];
                content.fields.subject = _.template(content.fields.subject, content.fields.metadata);
                content.fields.templateLocals = content.fields.templateLocals || {};
                if (parComment) {
                  content.fields.templateLocals.parentComment = commentUtils.cleanComment(parComment.value);
                } else {
                  content.fields.templateLocals.parentComment = '';
                }
                content.fields.templateLocals.callerComment = commentUtils.cleanComment(callComment.value);
                content.fields.templateLocals.title = obj.title;
                content.fields.templateLocals.link = content.fields.metadata.globals.urlPrefix + '/' + modelName + 's/' + obj.id;
              }
              cb(err, content);
            });
          });
        });
      });
    });
  }
};
