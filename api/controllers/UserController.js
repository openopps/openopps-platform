/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var exportUtil = require('../services/utils/export');
var validator = require('validator');

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
		sails.log.verbose('username', req.params)
		// don't allow empty usernames
		if (!req.params.id) {
			return res.send(true);
		}

		// only allow email usernames, so check if the email is valid
		if (validator.isEmail(req.params.id) !== true) {
			return res.send(true);
		}
		// check if a user already has this email
		User.findOneByUsername(req.params.id.toLowerCase(), function (err, user) {
			if (err || !user) sails.log.error('User.findOneByUsername failed', req.params, err, user);
			if (err) { return res.send(400, { message:'Error looking up username.' }); }
			if (!user) { return res.send(false); }
			// TODO: why is this checking if user is logged in?
			if (req.user && req.user.id == user.id) { return res.send(false); }
			return res.send(true);
		});
	},

  find: function(req, res) {
    if (req.route.params.id) {
      userId = req.route.params.id;
			User.findOne(userId).populate('tags').populate('badges')
			.exec(function(err, user){
				sails.log.verbose('find (err user)',err,user);
				if (err) return res.negotiate(err);
				user.isOwner = false;
				if (req.user && req.user.id === user.id) user.isOwner = true;
				if (req.user && req.user.id != user.id && !req.user.isAdmin) user.username = null; // hide email address
				return res.send(user);
			});
    } else {
			// With no ID given, send the user's own info
			// If the user is not logged in, return null object
			if (!req.user) return res.send(403, null);

			req.user.isOwner = true;
			return res.send(req.user);
		}
  },

  findOne: function(req, res) {
    module.exports.find(req, res);
  },

  all: function (req, res) {
    User.find().populate('tags').exec(function (err, users) {
      users = _.reject(users, function (u) { return u.disabled; });
      if (err) {
        return res.serverError(err);
      }
      _.each(users, function (user) {
        delete user.auths;
        delete user.passwordAttempts;
        user.location = _.findWhere(user.tags, {type: 'location'});
        user.agency = _.findWhere(user.tags, {type: 'agency'});
      });
      res.send(users);
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
		sails.log.verbose('UserController.activities')
		var userId = (req.user || req.params).id;
		if (!userId) res.badRequest("Cant't get activies: no user specified")
    var result = {tasks: {created:[], volunteered:[]}};
		// TODO: this should be refactored into User model
    async.parallel([
      // find tasks that the user has volunteered for
      function(callback) {
        var getTask = function(vol, done) {
          Task.findOne()
          .where({ id: vol.taskId })
          .exec(function(err, taskEntry) {
						// TODO
            // taskUtils.getMetadata(taskEntry, userId, function(err, newTask) {
            //   if (!err) {
            //     tasks.created.push(newTask);
            //   }
              return done(err);
            // });
          });
        };
        Volunteer.find()
        .where({ userId: userId })
        .exec(function(err, volList) {
          if (err) { return res.send(400, { message: 'Error looking up volunteered tasks.'}); }
          async.each(volList, getTask, function(err) {
            if (err) { return res.send(400, { message: 'Error looking up volunteered tasks.'}); }
            callback(err);
          });
        });
      },
			function(callback) {
				Task.find({userId: userId})
				.exec(function(err, createdTasks) {
					result.tasks.created = createdTasks;
					callback(err);
				})
			}
			],
      function(err) {
        if (err) { return res.send(400, { message: 'Error looking up tasks or projects.'}); }
        return res.send(result);
      });
  },

  photo: function(req, res) {
    User.findOneById(req.route.params.id, function (err, user) {
      if (err || !user) { return res.redirect('/images/default-user-icon-profile.png'); }
      if (user.photoId) {
        return res.redirect(307, '/api/upload/get/' + user.photoId);
      } else if (user.photoUrl) {
        return res.redirect(307, user.photoUrl);
      } else {
        return res.redirect(307, '/images/default-user-icon-profile.png');
      }
    });
  },

  // Enable a disabled user
  //
  enable: function ( request, response ) {

    var requestedUserId = request.route.params.id;

    User.findOneById( requestedUserId, function ( error, user ) {

      if ( error || ! user ) {
        return response.send(
          400,
          { message: 'An error occured looking up this user.', error: error }
        );
      }

      user.disabled = false;

      user.save( function ( error ) {

        if ( error ) {
          return response.send(
            400,
            { message: 'An error occured enabling this user.', error: error }
          );
        }

        return response.send( user );

      } );

    } );


  },

  // Disable a user so that they cannot log in
  //
  disable: function ( request, response ) {

    var currentUser     = request.user[ 0 ];
    var requestedUserId = request.route.params.id;
    var isSelfEditing   = ( currentUser.id === requestedUserId );

    // Check that we're permitted to disable this user
    //
    if ( isSelfEditing || currentUser.isAdmin ) {

      if ( isSelfEditing ) {

        currentUser.disabled = true;

        currentUser.save( function ( error ) {
          if ( error ) {
            return response.send(
              400,
              { message: 'An error occurred disabling this user.', error: error }
            );
          }
          return response.send( currentUser );
        } );

      } else {

        User.findOneById( requestedUserId, function( error, user ) {
          if ( error ) {
            return response.send(
              400,
              { message: 'An error occurred looking up this user.', error: error }
            );
          }
          user.disabled = true;
          user.save( function ( error ) {
            if ( error ) {
              return response.send(
                400,
                { message: 'An error occurred disabling this user.', error: error }
              );
            }
            return response.send( user );
          } );
        } );

      }

    } else {

      response.send( 403, { message: 'Not authorized.' } );

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
    var userId = req.user.id;
    // Allow administrators to set other users' passwords
    if ((req.user.isAdmin === true) && (req.param('id'))) {
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
      // Run password validator (but only if not an admin) - TODO: why?
      if (req.user.isAdmin !== true) {
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

      Passport.findOrCreate({
        user: user.id,
        protocol: 'local'
      }).exec(function(err, passport) {
        passport.password = password;
        passport.save(function (err, newPasswordObj) {
          if (err) return res.send(400, {
            message: 'Error storing new password.'
          });

          // Reset login
          user.passwordAttempts = 0;
          user.save(function(err, user) {
            if (err) {
              return res.send(400, {
                message: 'Error resetting passwordAttempts',
                error: err
              });
            }
            // success, return true
            return res.send(true);
          });
        });
      });

    });

  },

  export: function (req, resp) {
    User.find().populate('tags').exec(function (err, users) {

      users.forEach(function(user) {
        if (!user.tags) return;
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
