/**
 * Volunteer
 *
 * @module      :: Model
 * @description :: Stores volunteer information for tasks
 *
 */
var noteUtils = require('../services/notifications/manager');

module.exports = {

  attributes: {

    // The task which a user volunteers for
    taskId: 'INTEGER',
    // the user that is volunteering
    userId: 'INTEGER'

  },

  // create notification after creating a volunteer
  afterCreate: function (values, cb){
    var params = {
      trigger: {
        callerType: 'Task',
        callerId: values.taskId,
        action: 'taskVolunteerAdded'
      },
      data: {
        audience: {
          'taskVolunteer': {
            fields: {
                taskId: values.taskId,
                volunteerId: values.userId
            }
          },
          'volunteerSupervisor': {
            fields: {
              taskId: values.taskId,
              volunteerId: values.userId
            }
          }
        }
      }
    };

    noteUtils.notifier.notify(params, cb);
  },

  beforeDestroy: function (values, cb){
   Volunteer.findOne({ id: values.where.id }).exec(function(err, volunteer) {
      if (err) done(err);
      var params = {
      trigger: {
        callerType: 'Task',
        callerId: volunteer.taskId,
        action: 'taskVolunteerRemoved'
      },
      data: {
        audience: {
          'taskVolunteer': {
            fields: {
              //we set volunteer id to userid because the look up is labeled wrong
              //        and says it expects volunteerId but really it's using userId
              //        for a where on the user model
                taskId: volunteer.taskId,
                userId: volunteer.userId,
                volunteerId: volunteer.userId
            }
          }
        }
      }
    };
    noteUtils.notifier.notify(params, cb);
   });
  }
};
