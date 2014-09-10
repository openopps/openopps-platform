var _ = require('underscore');
var validator = require('validator');
var async = require('async');
var tagUtils = require('./tag');
var noteUtils = require('../notifications/manager');

module.exports = {

  /**
   * Find a user by given username.  Looks up the user
   * by username or by email address
   *
   * @param username
   * @param done callback with the user object, or null if no user
   *        format: done(err, user)
   */
  findUser: function (username, done) {
    username = username.toLowerCase();
    // Check if the username already exists
    User.findOneByUsername(username, function (err, user) {
      if (err) { return done(err, null); }
      if (user) { return done(null, user); }
      // user not found, try again by email address
      UserEmail.findOneByEmail(username, function (err, userEmail) {
        if (err) { return done(err, null); }
        if (!userEmail) { return done(null, null); }
        // email address found; look up the user object
        User.findOneById(userEmail.userId, function (err, user) {
          if (err) { return done(err, null); }
          return done(null, user);
        });
      });
    });
  },

  /**
   * Get the preferred email address for a user
   *
   * @param id userId of the user's email to look up
   * @param done callback with the form (err, emailObj)
   *        where emailObj is a UserEmail model
   */
  findPrimaryEmail: function (id, done) {
    // find the latest email with the `isPrimary` flag set
    // (usually done via an update statement)
    UserEmail.findOne()
    .where({ userId: id })
    .where({ isPrimary: true })
    .sort({ updatedAt: -1 })
    .exec(function (err, userEmail) {
      if (err) { return done(err, null); }
      // if there's no results from `isPrimary`, get the
      // last email address added
      if (!userEmail) {
        // look up the most recent email
        UserEmail.findOne()
        .where({ userId: id })
        .sort({ createdAt: -1 })
        .exec(function (err, userEmail) {
          if (err) { return done(err, null); }
          return done(null, userEmail);
        });
      } else {
        return done(null, userEmail);
      }
    });
  },

  /**
   * Create a user based on their username and password.
   *
   * @param username
   * @param password will be bcrypt encrypted
   * @param done callback with form (null, user, error)
   */
  createLocalUser: function (username, password, providerUser, req, done) {
    var self = this;
    var updateAction = true;
    // handle missing parameters
    if (typeof providerUser === 'function'){
      done = providerUser;
      providerUser = {};
      req = {};
      updateAction = false;
    }
    if (typeof req === 'function'){
      done = req;
      req = {};
    }
    var userData = {
      name: providerUser.displayName,
      photoUrl: providerUser.photoUrl,
      title: providerUser.title,
      bio: providerUser.bio,
      username: username.toLowerCase(),
      password: password
    };

    // for unit tests; only works when NODE_ENV=test is set in the environment
    if ((username == 'admin@midascrowd.com') && (process.env.NODE_ENV == 'test')) {
      userData.isAdmin = true;
      updateAction = true;
    }

    // Run username validator (but only if SSPI is disabled)
    if (sails.config.auth.auth.sspi.enabled !== true) {
      // ensure the username is a valid email address
      if (validator.isEmail(userData.username) !== true) {
        return done(null, false, { message: 'Email address is not valid.' });
      }
    }
    // Check if the username already exists
    this.findUser(userData.username, function (err, user) {
      if (err) { return done(null, false, { message: 'Error looking up user' }); }
      // Look up user and check password hash
      var bcrypt = require('bcrypt');

      // Takes the userData object and creates a tag object from it
      function create_tag_obj (userObj) {
        var result = {};
        if (userObj.skill && userObj.skill.length > 0) {
          result.skill = userObj.skill;
        }
        if (userObj.topic && userObj.topic.length > 0) {
          result.topic = userObj.topic;
        }
        if (userObj.location) {
          result.location = [ userObj.location ];
        }
        if (userObj.company) {
          result.agency = [ userObj.company ];
        }
        return result;
      };

      // no user, create one
      if (!user) {
        // Run password validator (but only if SSPI is disabled)
        if (sails.config.auth.auth.sspi.enabled !== true) {
          // Check that the password meets validation rules
          var rules = self.validatePassword(userData.username, userData.password);
          var success = true;
          _.each(_.values(rules), function (v) {
            success = success && v;
          });
          if (success !== true) {
            return done(null, false, { message: 'Password does not meet password rules.' });
          }
        }
        // Encrypt the password
        bcrypt.hash(userData.password, 10, function(err, hash) {
          if (err) { return done(null, false, { message: 'Unable to hash password.'}); }
          // Create and store the user
          var userCreateParam = {
            username: userData.username
          };
          if (updateAction) {
            userCreateParam = userData;
          }
          User.create(userCreateParam).exec(function (err, user) {
            if (err) {
              sails.log.debug('User creation error:', err);
              return done(null, false, { message: 'Unable to create new user. Please try again.'});
            }
            sails.log.debug('User Created:', user);
            var pwObj = {
              userId: user.id,
              password: hash
            };
            // Store the user's password with the bcrypt hash
            UserPassword.create(pwObj).exec(function (err, pwObj) {
              if (err) { return done(null, false, { message: 'Unable to store password.'}); }
              // if the username is an email address, store it
              if (validator.isEmail(userData.username) !== true) {
                // email validation failed, proceed
                return done(null, user);
              }
              var email = {
                userId: user['id'],
                email: userData.username,
              };
              // Store the email address
              var tags = create_tag_obj(providerUser);
              UserEmail.create(email).exec(function (err, email) {
                if (err) { return done(null, false, { message: 'Unable to store user email address.', err: err }); }
                tagUtils.findOrCreateTags(user.id, tags, function (err, newTags) {
                  if (err) { return done(null, false, { message: 'Unabled to create tags', err: err }); }
                  return done(null, user);
                });
              });
            });
          });
        });
      }
      else {
        if (!updateAction) {
          return done(null, false, { message: 'User already exists. Please log in instead.' });
        }
        // if this user is logged in, then we may be updating their information
        if (user.disabled === true) {
          return done(null, false, { message: 'Your account is disabled.' });
        }
        var update = false;
        if (providerUser.overwrite || (!user.name && userData.name)) {
          user.name = userData.name || null;
          update = true;
        }
        if (providerUser.overwrite || (!user.photoId && !user.photoUrl && userData.photoUrl)) {
          user.photoUrl = userData.photoUrl || null;
          update = true;
        }
        if (providerUser.overwrite || (!user.bio && userData.bio)) {
          user.bio = userData.bio || null;
          update = true;
        }
        if (providerUser.overwrite || (!user.title && userData.title)) {
          user.title = userData.title || null;
          update = true;
        }

        var checkTagUpdate = function (cbTagUpdate) {
          // abort if overwrite is turned off
          if (providerUser.overwrite !== true) {
            sails.log.debug('NO OVERWRITE');
            return cbTagUpdate(null);
          }
          sails.log.debug('OVERWRITE');
          var tags = create_tag_obj(providerUser);
          // Only update user tags if `overwrite` is turned on
          tagUtils.findOrCreateTags(user.id, tags, function (err, newTags) {
            sails.log.debug('New Tags:', newTags);
            if (err) { return done(null, false, { message: 'Unable to find or create tags.', err: err }); }
            // Get the ids of the current tags
            var newTagIds = [];
            for (var i in newTags) {
              newTagIds.push(newTags[i].id);
            }
            // Prune old tags
            tagUtils.pruneTags(user.id, newTagIds, function (err, removedTags) {
              sails.log.debug('Prune Tags:', removedTags);
              cbTagUpdate(err);
            });
          });
        };

        if (update === true) {
          sails.log.debug('UPDATE');
          user.save(function (err) {
            if (err) { return done(null, false, { message: 'Unable to update user information.' }); }
            // check if tags should be updated
            checkTagUpdate(function (err) {
              return done(err, user);
            });
          });
        // user object has not been updated, check tags
        } else {
          sails.log.debug('NO UPDATE');
          // check if tags should be updated
          checkTagUpdate(function (err) {
            return done(err, user);
          });
        }
      }
    });
  },

  /**
   * Find and log in a user based on their username and password.
   *
   * @param username
   * @param password will be bcrypt encrypted
   * @param done callback with form (null, user, error)
   */
  findLocalUser: function (username, password, userData, req, done) {
    var updateAction = true;
    if(typeof userData === 'function'){
      done = userData;
      userData = {};
      updateAction = false;
    }
    if(typeof req === 'function'){
      done = req;
      req = {};
    }
    userData = {
      name: userData.displayName,
      photoUrl: userData.photoUrl,
      title: userData.title,
      bio: userData.bio
    };
    if (userData.emails && (userData.emails.length > 0)) {
      // normalize username
      userData.username = userData.emails[0].value.toLowerCase();
    }
    else {
      // normalize username
      userData.username = username.toLowerCase();
    }
    userData.password = password;
    // Check if the username already exists
    this.findUser(userData.username, function (err, user) {
      if (err) { return done(null, false, { message: 'Error looking up user. Please try again.' }); }
      // Look up user and check password hash
      var bcrypt = require('bcrypt');
      // The user doesn't exist, error out (they must register)
      if (!user) {
        return done(null, false, { message: 'Invalid email address or password.' });
      } else {
        // Deny disabled users
        if (user.disabled === true) {
          sails.log.info('Disabled user login: ', user);
          return done(null, false, { message: 'Invalid email address or password.' });
        }
        // The user exists so look up their password -- the last password is the valid one
        UserPassword.find()
        .where({ userId: user.id })
        .sort({ createdAt: 'desc' })
        .limit(1)
        .exec(function (err, pwObj) {
          // If no password is set or there is an error, abort
          if (err || !pwObj || pwObj.length == 0) { return done(null, false, { message: 'Invalid email address or password.'}); }
          // Compare the passwords to check if it is correct
          bcrypt.compare(userData.password, pwObj[0].password, function (err, res) {
            // Valid password
            if (res === true) {
              // Deny users that have exceeded their password attempts
              if ((sails.config.auth.auth.local.passwordAttempts > 0) &&
                  (user.passwordAttempts >= sails.config.auth.auth.local.passwordAttempts)) {
                sails.log.info('Locked out user: ', user);
                // TODO: insert link here to reset password
                return done(null, false, { message: 'Your account has been locked, please reset your password.' });
              }
              sails.log.debug('User Found:', user);
              user.passwordAttempts = 0;
              if(updateAction){
                if (!user.photoId && !user.photoUrl && userData.photoUrl) {
                  user.photoUrl = userData.photoUrl;
                }
                if (!user.bio && userData.bio) {
                  user.bio = userData.bio;
                }
                if (!user.title && userData.title) {
                  user.title = userData.title;
                }
              }
              user.save(function (err) {
                if (err) { return done(null, false, { message: 'An error occurred while logging on. Please try again.' }); }
                return done(null, user);
              });
            }
            // Invalid password
            else {
              if ((sails.config.auth.auth.local.passwordAttempts > 0) &&
                  (user.passwordAttempts >= sails.config.auth.auth.local.passwordAttempts)) {
                sails.log.info('Locked out user: ', user);
                // TODO: insert link here to reset password
                return done(null, false, { message: 'Invalid email address or password.  If you have an account, you can reset your password.' });
              }
              user.passwordAttempts++;
              user.save(function (err) {
                if (err) { return done(null, false, { message: 'An error occurred while logging on. Please try again.' }); }
                return done(null, false, { message: 'Invalid email address or password.' });
              });
            }
          });
        });
      }
    });
  },

  /**
   * Handle the case where a user forgets their password
   *
   * @param email the email address of the user
   * @param cb callback of the form cb(err);
   */
  forgotPassword: function (email, cb) {
    email = email.toLowerCase().trim();
    // check if this is a valid email address
    if (validator.isEmail(email) !== true) {
      return cb({ message: 'Please enter a valid email address.' }, {});
    }
    UserEmail.findOneByEmail(email, function (err, emailObj) {
      // if there's no matching email address, don't provide the user feedback.
      // make it look like success
      if (err || !emailObj) {
        return cb(null, {});
      }
      // make sure the user exists and is enabled
      User.findOneById(emailObj.userId, function (err, user) {
        if (err) { return cb({ message: 'Error looking up your account', err: err }); }
        // if the user doesn't exist
        if (!user) { return cb(null, {}); }
        // create a reset token
        var token = {
          userId: user.id
          // token is auto-generated by the model
        };
        UserPasswordReset.create(token, function (err, newToken) {
          if (err) { return cb({ message: 'Error creating a reset password token.', err: err }); }
          // Generate a notification email to the user
          var params = {
            trigger: {
              callerType: 'UserPasswordReset',
              callerId: newToken.id,
              token: newToken.token,
              action: 'userPasswordReset'
            },
            data: {
              audience: {
                'user': {
                  fields: {
                    userId: user.id
                  }
                }
              }
            }
          };
          noteUtils.notifier.notify(params, function (err) {
            // pass the token back
            cb(err, newToken);
          });
        });
      });
    });
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
    expiry.setTime(expiry.getTime() - sails.config.auth.auth.local.tokenExpiration);
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

  /**
   * Create a user using OAuth Credentials
   *
   * @param provider the provider information from passport
   * @param req the req object from express
   * @param tokens the access and refresh tokens in an object
   * @param providerUser the user object provided by the provider
   * @param done callback when finished with arguments (null, user, error)
   */
  createOauthUser: function (provider, req, tokens, providerUser, done) {
    // Helper function to takes the providerUser object
    // and create a tag object from it
    var create_tag_obj = function (inputUser) {
      var result = {};
      if (inputUser.skill && inputUser.skill.length > 0) {
        result.skill = inputUser.skill;
      }
      if (inputUser.topic && inputUser.topic.length > 0) {
        result.topic = inputUser.topic;
      }
      if (inputUser.location) {
        result.location = [ inputUser.location ];
      }
      if (inputUser.company) {
        result.agency = [ inputUser.company ];
      }
      return result;
    };

    // Helper function to check if the tags should be updated, and
    // if so, go ahead and update/prune the tags
    var checkTagUpdate = function (userId, inputUser, cbTagUpdate) {
      // abort if overwrite is turned off
      if (inputUser.overwrite !== true) {
        return cbTagUpdate(null);
      }
      var tags = create_tag_obj(inputUser);
      // Only update user tags if `overwrite` is turned on
      tagUtils.findOrCreateTags(userId, tags, function (err, newTags) {
        if (err) { return done(null, false, { message: 'Unable to find or create tags.', err: err }); }
        // Get the ids of the current tags
        var newTagIds = [];
        for (var i in newTags) {
          newTagIds.push(newTags[i].id);
        }
        // Prune old tags
        tagUtils.pruneTags(userId, newTagIds, function (err, removedTags) {
          cbTagUpdate(err);
        });
      });
    };

    // check if the remote credentials match an existing user
    UserAuth.find({ where: { providerId: providerUser.id, provider: provider } }, function (err, userAuth) {
      if (!userAuth) { userAuth = []; }
      if (err) { return done(null, false, { message: 'Error looking up user credentials.' }); }
      // If the user's authentication tokens don't exist
      // then add the authentication tokens and update the user profile
      if (userAuth.length === 0) {
        var user = {
          name: providerUser.displayName,
          photoUrl: providerUser.photoUrl,
          title: providerUser.title,
          bio: providerUser.bio
        };
        if (providerUser.emails && (providerUser.emails.length > 0)) {
          user.username = providerUser.emails[0].value.toLowerCase();
        }

        // Utility function that completes the oauth user creation/update process
        // Stores the credentials and the user's other profile data
        var user_cb = function(err, user) {
          var creds = {
            userId: user['id'],
            provider: provider,
            providerId: providerUser.id,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          };
          // store login credentials
          UserAuth.create(creds).exec(function (err, creds) {
            if (err) { return done(null, false, { message: 'Unable to store user credentials.' }); }
            sails.log.debug('Created Credentials:', creds);
            // Store emails if they're available
            if (providerUser.emails && (providerUser.emails.length > 0)) {
              var email = {
                userId: user['id'],
                email: providerUser.emails[0].value.toLowerCase(),
              };
              UserEmail.findOne(email, function (err, storedEmail) {
                if (storedEmail) { return done(null, user); }
                UserEmail.create(email).exec(function (err, email) {
                  if (err) { return done(null, false, { message: 'Unable to store user email address.' }); }
                  sails.log.debug('Created Email:', email);
                  return done(null, user);
                });
              });
            } else {
              return done(null, user);
            }
          });
        };

        // if this user is logged in, then we're adding a new
        // service for them.  Update their user model fields if they
        // aren't already set.
        if (req.user) {
          if (req.user[0].disabled === true) {
            return done(null, false, { message: 'Your account is disabled.' });
          }
          var update = false;
          if (providerUser.overwrite || (!req.user[0].photoId && !req.user[0].photoUrl && providerUser.photoUrl)) {
            req.user[0].photoUrl = providerUser.photoUrl || null;
            update = true;
          }
          if (providerUser.overwrite || (!req.user[0].bio && providerUser.bio)) {
            req.user[0].bio = providerUser.bio || null;
            update = true;
          }
          if (providerUser.overwrite || (!req.user[0].title && providerUser.title)) {
            req.user[0].title = providerUser.title || null;
            update = true;
          }

          if (update === true) {
            req.user[0].save(function (err) {
              if (err) { return done(null, false, { message: 'Unable to update user information.' }); }
              // check if tags should be updated
              checkTagUpdate(req.user[0].id, providerUser, function (err) {
                return user_cb(err, req.user[0]);
              });
            });
          // user object has not been updated, check tags
          } else {
            // check if tags should be updated
            checkTagUpdate(req.user[0].id, providerUser, function (err) {
              return user_cb(err, req.user[0]);
            });
          }
        }
        // create user because the user is not logged in
        else {
          User.create(user).exec(function (err, user) {
            sails.log.debug('Created User: ', user);
            if (err) { return done(null, false, { message: 'Unable to create user.' }); }
            var tags = create_tag_obj(providerUser);
            // Update the user's tags
            tagUtils.findOrCreateTags(user.id, tags, function (err, newTags) {
              user_cb(null, user);
            });
          });
        }
      }
      // The user has authentication tokens already for this provider, update them.
      else {
        userAuth = userAuth[0];
        // Update access and refresh tokens
        userAuth.accessToken = tokens.accessToken;
        userAuth.refreshToken = tokens.refreshToken;
        userAuth.save(function (err) {
          if (err) { return done(null, false, { message: 'Unable to update user credentials.' }); }
          // acquire user model and authenticate
          User.findOneById(userAuth['userId'], function (err, user) {
            if (!user || err) { return done(null, false, { message: 'Error looking up user.' }); }
            sails.log.debug('User Found:', user);

            var update = false;
            if (providerUser.overwrite || (user.photoId && !user.photoUrl && providerUser.photoUrl)) {
              user.photoUrl = providerUser.photoUrl || null;
              update = true;
            }
            if (providerUser.overwrite || (!user.bio && providerUser.bio)) {
              user.bio = providerUser.bio || null;
              update = true;
            }
            if (providerUser.overwrite || (!user.title && providerUser.title)) {
              user.title = providerUser.title || null;
              update = true;
            }

            if (update === true) {
              user.save(function (err) {
                if (err) { return done(null, false, { message: 'Unable to update user information.' }); }
                // check if tags should be updated
                checkTagUpdate(user.id, providerUser, function (err) {
                  return done(err, user);
                });
              });
            // user object has not been updated, check tags
            } else {
              // check if tags should be updated
              checkTagUpdate(user.id, providerUser, function (err) {
                return done(err, user);
              });
            }
          });
        });
      }
    });
  },

  /**
   * Clean fields from a user object that might
   * be sensitive.
   * @param user the user object to clean
   * @return a new user object
   */
  cleanUser: function (user, reqId) {
    var u = {
      id: user.id,
      username: null,
      name: user.name,
      title: user.title,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
    // if the requestor is the same as the user, show admin status
    if (user.id === reqId) {
      u.isAdmin = user.isAdmin
    }
    return u;
  },

  /**
   * Gets all the information about a user.
   *
   * @param userId: the id of the user to query
   * @param reqId: the requester's id
   */
  getUser: function (userId, reqId, cb) {
    var self = this;
    if (!_.isFinite(userId)) {
      return cb({ message: 'User ID must be a numeric value' }, null);
    }
    User.findOneById(userId, function (err, user) {
      if (err) { return cb(err, null); }
      delete user.deletedAt;
      if (userId != reqId) {
        user = self.cleanUser(user, reqId);
      }
      tagUtils.assemble({ userId: userId }, function (err, tags) {
        if (err) { return cb(err, null); }
        for (i in tags) {
          delete tags[i].projectId;
          delete tags[i].taskId;
          delete tags[i].updatedAt;
          delete tags[i].deletedAt;
          delete tags[i].userId;
          delete tags[i].tag.createdAt;
          delete tags[i].tag.updatedAt;
          delete tags[i].tag.deletedAt;
          if (tags[i].tag.type == 'agency') {
            if (!user.agency) {
              user.agency = tags[i];
            } else {
              // always use the latest tag stored, in case multiple are stored
              if (user.agency.createdAt < tags[i].createdAt) {
                user.agency = tags[i];
              }
            }
          }
          if (tags[i].tag.type == 'location') {
            if (!user.location) {
              user.location = tags[i];
            } else {
              // always use the latest tag stored, in case multiple are stored
              if (user.location.createdAt < tags[i].createdAt) {
                user.location = tags[i];
              }
            }
          }
         }
        user.tags = tags;
        Like.countByTargetId(userId, function (err, likes) {
          if (err) { return cb(err, null); }
          user.likeCount = likes;
          user.like = false;
          user.isOwner = false;
          Like.findOne({ where: { userId: reqId, targetId: userId }}, function (err, like) {
            if (err) { return cb(err, null); }
            if (like) { user.like = true; }
            // stop here if the requester id is not the same as the user id
            if (userId != reqId) {
              return cb(null, user);
            }
            // Look up which providers the user has authorized
            UserAuth.findByUserId(userId, function (err, auths) {
              if (err) { return cb(err, null); }
              user.auths = [];
              for (var i = 0; i < auths.length; i++) {
                user.auths.push(auths[i].provider);
              }
              // Look up the user's email addresses
              UserEmail.findByUserId(userId, function (err, emails) {
                if (err) { return cb(err, null); }
                user.isOwner = true;
                user.emails = [];
                if (emails) { user.emails = emails; }
                return cb(null, user);
              });
            });
          });
        });
      });
    });
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
      rules['username'] = true;
    }
    // length > 8 characters
    if (password && password.length >= 8) {
      rules['length'] = true;
    }
    // Uppercase, Lowercase, and Numbers
    for (var i = 0; i < password.length; i++) {
      var test = password.charAt(i);
      // from http://stackoverflow.com/questions/3816905/checking-if-a-string-starts-with-a-lowercase-letter
      if (test === test.toLowerCase() && test !== test.toUpperCase()) {
        // lowercase found
        rules['lower'] = true;
      }
      else if (test === test.toUpperCase() && test !== test.toLowerCase()) {
        rules['upper'] = true;
      }
      // from http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
      else if (!isNaN(parseFloat(test)) && isFinite(test)) {
        rules['number'] = true;
      }
    }
    // check for symbols
    if (/.*[^\w\s].*/.test(password)) {
      rules['symbol'] = true;
    }
    return rules;
  }
};
