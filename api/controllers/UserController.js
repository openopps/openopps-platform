/**
 * UserController
 *
 * @module		:: Controller
 * @description	:: Get and update information about currently logged in user.
 */
var async = require('async');
var _ = require('underscore');
var bcrypt = require('bcrypt');
var projUtils = require('../services/utils/project');
var taskUtils = require('../services/utils/task');
var exportUtil = require('../services/utils/export');
var tagUtils = require('../services/utils/tag');
var userUtils = require('../services/utils/user');
var validator = require('validator');
var actionUtil = require('sails/lib/hooks/blueprints/actionUtil');

module.exports = {

  /**
   * Check if a given username already exists
   *
   * @params :id of the username to test, eg:
   *         user/username/:id such as user/username/foo
   * @return true if the username is taken (can't be used),
   *         false if the username is available
   */
  username: function (req, res) {
    // don't allow empty usernames
    if (!req.route.params.id) {
      return res.send(true);
    }
    // only allow email usernames, so check if the email is valid
    if (validator.isEmail(req.route.params.id) !== true) {
      return res.send(true);
    }
    // check if a user already has this email
    userUtils.findUser(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message:'Error looking up username.' }); }
      if (!user) { return res.send(false); }
      if (req.user && req.user[0].id == user.id) { return res.send(false); }
      return res.send(true);
    });
  },

  info: function (req, res) {
    var reqId = null;
    if (req.user) {
      reqId = req.user[0].id;
    }
    sails.services.utils.user.getUser(req.route.params.id, reqId, function (err, user) {
      // prune out any info you don't want to be public here.
      if (reqId !== req.route.params.id) user.username = null;
      if (err) { return res.send(400, { message: err }); }
      sails.log.debug('User Get:', user);
      res.send(user);
    });
  },

  find: function(req, res) {
    // If the user is not logged in, return null object
    if (!req.user) {
      return res.send(403, null);
    }
    var reqId = req.user[0].id;
    var userId = req.user[0].id;
    if (req.route.params.id) {
      userId = req.route.params.id;
    }
    sails.services.utils.user.getUser(userId, reqId, req.user, function (err, user) {
      // this will only be shown to logged in users.
      if (userId !== reqId) user.username = null;
      if (err) { return res.send(400, err); }
      sails.log.debug('User Get:', user);
      res.send(user);
    });
  },

  findOne: function(req, res) {
    module.exports.find(req, res);
  },

  // TODO: make more efficient, currently does one query per user
  all: function (req, res) {
    User.find().exec(function (err, users) {
      if (err) return res.serverError(err);
      var fullUsers = [];
      var goodUsers = _.reject(users, 'disabled');
      async.each(goodUsers, function(user, cb) {
        var reqId = req.user[0].id;
        sails.services.utils.user['getUser'](user.id, reqId, req.user, function (err, fullUser) {
          if (err) cb(err);
          delete fullUser.auths;
          delete fullUser.passwordAttempts;
          fullUsers.push(fullUser);
          cb(null);
        });
      }, function (err) {
        if (err) return res.serverError(err);
        res.send(fullUsers);
      });
    });
  },

  // Use default Blueprint template with filtered data to return full profiles
  profile: function(req, res) {
    if (!req.user) return res.forbidden();

    // Lookup for records that match the specified criteria
    var Model = actionUtil.parseModel(req),
        where = _.omit(actionUtil.parseCriteria(req), 'access_token'),
        query = Model.find()
          .where(where)
          .limit(actionUtil.parseLimit(req))
          .skip(actionUtil.parseSkip(req))
          .sort(actionUtil.parseSort(req));

    query.exec(function found(err, matchingRecords) {
      if (err) return res.serverError(err);

      matchingRecords = _.reject(matchingRecords, 'disabled');
      var ids  = matchingRecords.map(function(m) { return m.id; }),
          reqId = req.user[0].id;

      async.map(ids, function(userId, cb) {
        sails.services.utils.user.getUser(userId, reqId, req.user, function (err, user) {
          if (err) return cb(err);
          if (userId !== reqId && !_.contains(where.username, user.username)) {
            delete user.username;
          }
          delete user.emails;
          delete user.auths;
          cb(null, user);
        });
      }, function(err, results) {
        if (err) { return res.send(400, err); }
        res.ok(results);
      });
    });
  },

  emailCount: function(req, res) {
    var testEmail = req.param('email');
    User.count({ username: testEmail }).exec(function(err, count) {
      if (err) { return res.send(400, err); }
      res.send('' + count);
    });
  },

  activities: function (req, res) {
    var reqId = null;
    var userId = (req.user ? req.user[0].id : null);
    if (req.user) {
      reqId = req.user[0].id;
    }
    if (req.route.params.id) {
      reqId = req.route.params.id;
    }
    var projects = [];
    var tasks = [];
    var volTasks = [];
    // Get projects owned by this user
    async.parallel([
      function(callback) {
        ProjectOwner.find()
        .where({ userId: reqId })
        .exec(function (err, ownerList) {
          var projIds = [];
          // Get each project that the current user is authorized to see
          var getProject = function(projId, done) {
            projUtils.authorized(projId, userId, function (err, proj) {
              if (proj) {
                // delete unnecessary data from projects
                delete proj.deletedAt;
                projects.push(proj);
              }
              done(err);
            });
          };
          for (var i in ownerList) {
            projIds.push(ownerList[i].projectId);
          }

          // Grab each of the projects
          async.each(projIds, getProject, function (err) {
            if (err) { return res.send(400, { message: 'Error looking up projects.'}); }
            // Then grab the project metadata
            var getMetadata = function(proj, done) {
              projUtils.getMetadata(proj, userId, function (err, newProj) {
                if (!err) {
                  proj = newProj;
                }
                return done(err);
              });
            };
            var getTaskMetadata = function(task, done) {
              taskUtils.getMetadata(task, userId, function(err, newTask) {
                if (!err) {
                  tasks.push(newTask);
                }
                return done(err);
              });
            };
            async.each(projects, getMetadata, function (err) {
              if (err) { return res.send(400, { message: 'Error looking up projects.'}); }
              // find tasks that user owns
              Task.find()
              .where({ userId: reqId })
              .exec(function (err, taskList) {
                if (err) { return res.send(400, { message: 'Error looking up tasks.'}); }
                async.each(taskList, getTaskMetadata, function (err) {
                  callback(err);
                });
              });
            });
          });
        });
      },
      // find tasks that the user has volunteered for
      function(callback) {
        var getTask = function(vol, done) {
          Task.findOne()
          .where({ id: vol.taskId })
          .exec(function(err, taskEntry) {
            taskUtils.getMetadata(taskEntry, userId, function(err, newTask) {
              if (!err) {
                volTasks.push(newTask);
              }
              return done(err);
            });
          });
        };
        Volunteer.find()
        .where({ userId: reqId })
        .exec(function (err, volList) {
          if (err) { return res.send(400, { message: 'Error looking up volunteered tasks.'}); }
          async.each(volList, getTask, function(err) {
            if (err) { return res.send(400, { message: 'Error looking up volunteered tasks.'}); }
            callback(err);
          });
        });
      }],
      function(err) {
        if (err) { return res.send(400, { message: 'Error looking up tasks or projects.'}); }
        return res.send({
          projects: projects,
          tasks: tasks,
          volTasks: volTasks
        });
      });
  },

  photo: function(req, res) {
    User.findOneById(req.route.params.id, function (err, user) {
      if (err || !user) { return res.redirect('/images/default-user-icon-profile.png'); }
      if (user.photoId) {
        return res.redirect(307, '/api/file/get/' + user.photoId);
      } else if (user.photoUrl) {
        return res.redirect(307, user.photoUrl);
      } else {
        return res.redirect(307, '/images/default-user-icon-profile.png');
      }
    });
  },

  // Enable a disabled user
  enable: function (req, res) {
    // policies will ensure only admins can run this function
    User.findOneById(req.route.params.id, function (err, user) {
      if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
      user.disabled = false;
      user.save(function (err) {
        if (err) { return res.send(400, { message: 'An error occurred enabling this user.', error: err }); }
        return res.send(user);
      });
    });
  },

  // Disable a user so that they cannot log in
  disable: function (req, res) {
    // check that we're permitted to disable this user
    if ((req.user[0].id == req.route.params.id) || (req.user[0].isAdmin)) {
      if (req.user[0].id == req.route.params.id) {
        req.user[0].disabled = true;
        req.user[0].save(function (err) {
          if (err) { return res.send(400, { message: 'An error occurred disabling this user.', error: err }); }
          return res.send(req.user[0]);
        });
      } else {
        User.findOneById(req.route.params.id, function (err, user) {
          if (err) { return res.send(400, { message: 'An error occurred looking up this user.', error: err }); }
          user.disabled = true;
          user.save(function (err) {
            if (err) { return res.send(400, { message: 'An error occurred disabling this user.', error: err }); }
            return res.send(user);
          });
        });
      }
    }
    else {
      res.send(403, { message: 'Not authorized.' });
    }
  },

  /**
   * Endpoint to reset a user's password.
   * @param Reset object that contains:
   *        {
   *           id: userId,
   *           password: newPassword
   *        }
   * Note that `id` is only allowed for administrators.
   * If not an administrator, you can only reset your own
   * password.
   * @return true if the operation is successful, an error object if unsuccessful
   */
  resetPassword: function (req, res) {
    // POST is the only supported method
    if (req.route.method != 'post') {
      return res.send(400, {message:'Unsupported operation.'});
    }
    var userId = req.user[0].id;
    // Allow administrators to set other users' passwords
    if ((req.user[0].isAdmin === true) && (req.param('id'))) {
      userId = req.param('id');
    }

    // check that a new password is provided
    if (!req.param('password')) {
      return res.send(400, { message: 'Password does not meet password rules.' });
    }
    var password = req.param('password');

    // find the user
    User.findOneById(userId, function (err, user) {
      if (err) { return res.send(400, { message: 'User not found.' }); }
      // Run password validator (but only if SSPI is disabled and not an admin)
      if ((sails.config.auth.auth.sspi.enabled !== true) && (req.user[0].isAdmin !== true)) {
        // Check that the password meets validation rules
        var rules = userUtils.validatePassword(user.username, password);
        var success = true;
        _.each(_.values(rules), function (v) {
          success = success && v;
        });
        if (success !== true) {
          return res.send(400, { message: 'Password does not meet password rules.' });
        }
      }

      // Encrypt the password
      bcrypt.hash(password, 10, function(err, hash) {
        if (err) { return res.send(400, { message: 'Unable to hash password.' }); }
        var pwObj = {
          userId: userId,
          password: hash
        };
        // Store the user's password with the bcrypt hash
        UserPassword.create(pwObj).exec(function (err, pwObj) {
          if (err) { return res.send(400, { message: 'Unable to store password.'}); }
          return res.send(true);
        });
      });
    });

  },

  export: function (req, resp) {
    User.find().populate('tags').exec(function (err, users) {

      users.forEach(function(user) {
        user.tags.forEach(function(tag) {
          user[tag.type] = tag.name;
        });
      });

      if (err) {
        sails.log.error("user query error. " + err);
        resp.send(400, {message: 'An error occurred while looking up users.', error: err});
        return;
      }
      sails.log.debug('user export: found %s', users.length);

      exportUtil.renderCSV(User, users, function (err, rendered) {
        if (err) {
          sails.log.error("user export render error. " + err);
          resp.send(400, {message: 'An error occurred while rendering user list.', error: err});
          return;
        }
        resp.set('Content-Type', 'text/csv');
        resp.set('Content-disposition', 'attachment; filename=users.csv');
        resp.send(200, rendered);
      });
    });
  }

};
