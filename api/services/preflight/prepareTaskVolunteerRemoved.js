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

    content.fields = _.extend({}, sails.services.utils.emailTemplate['generateEmailLocals'](settings.emailName));
    content.fields.metadata = sails.services.utils.emailTemplate['addGlobals'](fields.metadata || {});
    content.fields.metadata.taskLink = content.fields.metadata.globals.urlPrefix  + '/tasks';
    content.settings = {};

    var taskId = fields.metadata.modelTrigger.taskId || null;
    var userId = fields.metadata.modelTrigger.userId || null;

    Task.findOneById(taskId).exec(function (err, task) {
        if (err) { sails.log.debug(err); cb(null, content); return false;}

        content.fields.metadata.task = task;
        User.findOne({ id: userId }).exec(function(err, volunteer) {
          if (err) { sails.log.debug(err); cb(null, content); return false;}
          userUtils.findPrimaryEmail(userId, function (err, volunteerEmail) {
            if (err) { sails.log.debug(err); cb(null, content); return false; }
            if (volunteerEmail) {
              content.fields.volunteerId = userId || null;
              // for a volunteer this the volunteer id otherwise it will never not match
              content.fields.initiatorId = userId || null;
              User.findOne({ id: task.userId }).exec(function(err, owner) {
                userUtils.findPrimaryEmail(owner.id, function (err, ownerEmail) {
                    if (err) { sails.log.debug(err); cb(null, content); return false; }
                    if (ownerEmail) {
                      content.fields.cc = owner.name + ' <' + ownerEmail.email + '>';
                    } else {
                      content.fields.cc = null;
                    }

                    //end task owner email user utils
                  });
                //end owner user look up
              });
              // set the email fields

              content.fields.from = sails.config['systemEmail'];
              content.fields.to = volunteer.name + ' <' + volunteerEmail.email + '>';
              content.fields.subject = _.template(content.fields.subject)(content.fields.metadata);
          } else {
            cb(null,null);
          }

            //end volunteer email user utils
          });

          //end user lookup
        });
    });
  cb(null, content);
  }
};
