/**
 * Determine if a user has access to a task
 * Callback: function(err, task)
 * If both err and task are null, then task
 * was found but access is denied.
 */
var async = require('async');
var userUtil = require('./user');

var authorized = function (id, userId, user, cb) {
  if (typeof user === 'function') {
    cb = user;
    user = undefined;
  }
  Task.findOneById(id).populate('tags').exec(function (err, task) {
    if (err || !task) { return cb('Error finding task.', null); }
    task.isOwner = false;
    // otherwise, check that we have an owner
    if (userId && (userId == task.userId)) {
      task.isOwner = true;
    }
    // If not the owner, check if there is a public task
    if (!task.projectId) {
      if ((task.state !== 'draft') || (userId == task.userId) || (user && user.isAdmin)) {
        return cb(null, task);
      }
      return cb(null, null);
    }
    // check if the user is authorized for the project
    // or the project is open
    util.authorized(task.projectId, userId, function (err, proj) {
      if (err) { return cb(err, null); }
      if (!err && !proj) { return cb(null, null); }
      task.project = proj;
      // user has access to the task, but is not the task owner
      // check the task state to make sure it is publicly accessible
      if ((task.state !== 'draft') || (task.isOwner === true) || (user && user.isAdmin)) {
        return cb(null, task);
      }
      // In any other state, you have to be the owner.  Denied.
      return cb(null, null);
    });
  });
};

var getMetadata = function (task, user, cb) {
  if (!task) return cb();
  task.like = false;
  task.volunteer = false;
  // get owner information
  task.owner = { userId: task.userId };
  userUtil.addUserName(task.owner, function (err) {
    if (err) { return cb(err, task); }
    return cb(null, task);
    // TODO: not sure this is needed anymore...
    // Volunteer.findOne({ where: { userId: user.id, taskId: task.id }}, function (err, v) {
    //   if (err) { return cb(err, task); }
    //   if (v) { task.volunteer = true; }
    //   return cb(null, task);
    // });

  });
};

var getVolunteers = function (task, cb) {
  task.volunteers = [];
  Volunteer.find()
  .where({ taskId: task.id })
  .sort('createdAt')
  .exec(function (err, vols) {
    if (err) { return cb(err); }
    async.each(vols, userUtil.addUserName, function (err) {
      for (var i in vols) {
        task.volunteers.push({ id: vols[i].id, userId: vols[i].userId, name: vols[i].name });
      }
      cb();
    });
  });
};

/**
 * Find tasks that meet a certain where criteria
 * @param where query criteria, eg: { id: [5, 6, 7 ] } or { name: 'Title' }
 * @return callback(error, tasks)
 */
var findTasks = function (where, cb) {
  var self = this;
  var w = where || {};
  Task.find()
  .where(w)
  .populate('tags')
  .populate('owner')
  .sort({ publishedAt: 0, updatedAt: 0 })
  .exec(function (err, tasks) {
    if (err) { return cb({ message: 'Error looking up tasks.' }, null); }
    tasks.forEach(function (task) {
      var owner = task.owner;
      if (!owner) sails.log.error('no owner for task', task);
      else {
        task.owner = {
          id: owner.id,
          name: owner.name,
        };
      }
    });
    return cb(null, tasks);
  });
};

module.exports = {
  authorized: authorized,
  getMetadata: getMetadata,
  getVolunteers: getVolunteers,
  findTasks: findTasks,
};
