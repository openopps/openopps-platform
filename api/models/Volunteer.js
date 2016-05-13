/**
 * Volunteer
 *
 * @module      :: Model
 * @description :: Stores volunteer information for tasks
 *
 */
var Promise = require('bluebird');

module.exports = {

  attributes: {

    // the user that is volunteering
    userId: 'INTEGER',
    // send notification or not, after create
    silent: 'BOOLEAN',

    // The task which a user volunteers for
    task: {
      model: 'task',
      columnName: 'taskId'
    },

    toJSON: function() {
      var obj = this.toObject();
      obj.taskId = obj.task;    // backwards compatibility, TODO: API design
      delete obj.task;
      return obj;
    },

  },
  createAction: function(values) {
    var promise = Volunteer.create(values)
    .then(function(newVolunteer) {
      var assign = Promise.promisify(Volunteer.assignVolunteerCountBadges);
      return assign(newVolunteer).then(function() {
        if ( true === newVolunteer.silent ) { return newVolunteer; }

        return Notification.create({
          action: 'volunteer.create.thanks',
          model: newVolunteer
        }).then(function() {
          return newVolunteer;
        });
      });
    });
    return promise;
  },

  afterDestroy: function(model, done) {
    Notification.create({
      action: 'volunteer.destroy.decline',
      // Sails returns an array of deleted models,
      // but we're only deleting them one at a time
      model: model[0]
    }, done);
  },

  // query: {taskId: id} or an array of these
  //        or anything we can pass to find
  // returns a hash with taskId as the keys
  // value is an array of
  //    { id: <volunteer id>, name: <user.name>, userId: <user.id>}
  findUsersByTask: function(query) {
    var taskVolunteers = {};
    var promise =
    Volunteer.find(query)
    .then(function(vols) {
      volunteers = vols;
      var userIds = _.map(vols, function(v) { return {id: v.userId} });
      return User.find(userIds)
    })
    .then(function(users) {
      var userNames = {};
      _.forEach(users, function(user) {
        userNames[user.id] = user.name;
      });
      _.forEach(volunteers, function(v) {
        v.name = userNames[v.userId];
        delete v.silent;
        delete v.createdAt;
        delete v.updatedAt;
        var taskId = v.task;
        taskVolunteers[taskId] = taskVolunteers[taskId] || []
        taskVolunteers[taskId].push(v);
        delete v.task;
      });
      return taskVolunteers;
    });
    return promise;
  },

  assignVolunteerCountBadges: function (model, done) {

    Volunteer.find({ taskId: model.task }).exec(function(err, vols) {
      if (err) return done(err);

      if (vols.length === 4) {
        Task.findOne({ id: model.task }).exec(function(err, task) {
          if (err) return done(err);

          var badge = {
            user: task.owner,
            type: 'team builder',
            task: model.task
          };

          Badge.findOrCreate(badge, badge).exec(function(err, b){
            // swallow a potential error (expected) that the badge already exists.
            if (err && err._e.toString().match('Badge already exists')) {
              err = null;
            }

            if (err) return done(err);
            done();
          });
        });
      } else {
        done();
      }
    });

  }
};
