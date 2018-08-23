const _ = require ('lodash');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const uuid = require('uuid');
const log = require('log')('app:auth:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const userService = require('../user/service');
const Audit = require('../model/Audit');

const baseUser = {
  isAdmin: false,
  isAgencyAdmin: false,
  disabled: false,
  passwordAttempts: 0,
  completedTasks: 0,
};

const basePassport = {
  protocol: 'local',
};

async function register (attributes, done) {
  attributes.username = attributes.username.toLowerCase().trim();
  if((await dao.User.find('lower(username) = ?', attributes.username)).length > 0) {
    done({ message: 'The email address provided is not a valid government email address or is already in use.' });
  } else {
    var newUser = _.extend(_.clone(baseUser), attributes);
    newUser.createdAt = new Date();
    newUser.updatedAt = new Date();
    await dao.User.insert(newUser).then(async (user) => {
      log.info('created user', user);

      var tags = attributes.tags || attributes['tags[]'] || [];
      await userService.processUserTags(user, tags).then(tags => {
        user.tags = tags;
      });
      var passwordReset = {
        userId: user.id,
        token: uuid.v4(),
        createdAt: new Date(),
        updatedAt: new Date,
      };
      await dao.UserPasswordReset.insert(passwordReset).then((obj) => {
        return done(null, _.extend(user, { token: obj.token }));
      }).catch((err) => {
        log.info('Error creating password reset record', err);
        return done(true);
      });
    }).catch(err => {
      log.info('register: failed to create user ', attributes.username, err);
      return done(true);
    });
  }
}

async function sendUserCreateNotification (user, action) {
  var data = {
    action: action,
    model: {
      name: user.name,
      username: user.username,
      token: user.token,
    },
  };
  notification.createNotification(data);
}

async function resetPassword (token, password, done) {
  token.deletedAt = new Date();
  var user = { id: token.userId, passwordAttempts: 0, updatedAt: new Date() };
  await dao.Passport.find('"user" = ?', token.userId).then(async (results) => {
    var passport = results[0] || {};
    passport.user = token.userId;
    passport.password = await bcrypt.hash(password, 10);
    passport.accessToken = crypto.randomBytes(48).toString('base64');
    passport.updatedAt = new Date();
    passport.createdAt = passport.createdAt || new Date();
    passport.protocol = passport.protocol || 'local';
    await dao.Passport.upsert(passport).then(async () => {
      await dao.User.update(user).then(async () => {
        await dao.UserPasswordReset.update(token).then(() => {
          done(null);
        });
      });
    }).catch((err) => {
      log.info('reset: failed to create or update passport ', token.email, err);
      done({ message: 'Failed to reset password.' });
    });
  });
}

async function forgotPassword (username, error) {
  if (!validator.isEmail(username)) {
    return done('Please enter a valid email address.');
  }
  await dao.User.findOne('username = ?', username).then(async (user) => {
    var passwordReset = {
      userId: user.id,
      token: uuid.v4(),
      createdAt: new Date(),
      updatedAt: new Date,
    };
    await dao.UserPasswordReset.insert(passwordReset).then((obj) => {
      return error(obj.token, false);
    }).catch((err) => {
      log.info('Error creating password reset record', err);
      return error(null, 'An error has occurred processing your request. Please reload the page and try again.');
    });
  }).catch((err) => {
    log.info('Forgot password attempt', 'No user found for email', username);
    return error(null, false); // Make it look like a success
  });
}

async function sendUserPasswordResetNotification (username, token, action) {
  await dao.User.findOne('username = ?', username).then((user) => {
    var data = {
      action: action,
      model: {
        user: { name: user.name, username: username },
        token: token,
      },
    };
    notification.createNotification(data);
  }).catch((err) => {
    log.info('Error sending forgot password notification', err);
  });
}

async function checkToken (token, done) {
  var expiry = new Date();
  expiry.setTime(expiry.getTime() - openopps.auth.local.tokenExpiration);
  await dao.UserPasswordReset.findOne('token = ? and "createdAt" > ? and "deletedAt" is null', [token, expiry]).then(async (passwordReset) => {
    await dao.User.findOne('id = ?', passwordReset.userId).then((user) => {
      return done(null, _.extend(_.clone(passwordReset), { email: user.username }));
    }).catch((err) => {
      return ({ message: 'Error looking up user.', err: err }, null);
    });
  }).catch((err) => {
    return ({ message: 'Error looking up token.', err: err }, null);
  });
}

function validate (data, hash) {
  return bcrypt.compareSync(data.join('|'), hash);
}

async function createStagingRecord (user, done) {
  await dao.AccountStaging.upsert(_.extend(user, { uuid: uuid.v4() })).then(account => {
    done(null, _.extend(account, { hash: bcrypt.hashSync([account.linkedId, account.uuid].join('|'), 10) }));
  }).catch(err => {
    done(err);
  });
}

async function linkAccount (user, data, done) {
  var account = await dao.AccountStaging.findOne('linked_id = ?', user.linkedId).catch(() => { return null; });
  if(!account || user.linkedId !== account.linkedId || !validate([account.linkedId, account.uuid, account.username], data.h)) {
    done({ message: 'This link is no longer valid.' });
  } else {
    await dao.User.findOne('username = ? and linked_id = \'\'', account.username).then(async u => {
      u.linkedId = account.linkedId;
      u.governmentUri = account.governmentUri;
      await dao.User.update(u);
      u.access_token = user.access_token,
      u.id_token = user.id_token,
      await dao.AccountStaging.delete(account);
      done(null, u);
    }).catch(err => {
      done(err);
    });
  }
}

async function sendFindProfileConfirmation (data, done) {
  var account = await dao.AccountStaging.findOne('linked_id = ?', data.id).catch(() => { return null; });
  if(!account || !validate([account.linkedId, account.uuid], data.h)) {
    done({ message: 'Invalid request' });
  } else {
    await dao.User.findOne('username = ? and linked_id = \'\'', data.email).then(async user => {
      await dao.AccountStaging.update(_.extend(account, { username: user.username })).then(account => {
        notification.createNotification({
          action: 'find.profile.confirmation',
          model: {
            user: { name: user.name, username: user.username },
            hash: bcrypt.hashSync([account.linkedId, account.uuid, account.username].join('|'), 10),
          },
        });
        done();
      }).catch(err => {
        // TODO: Something bad happened
        log.info('Error occured updating account staging record when sending find profile confirmation email.', err);
        done({ message: 'Unkown error occurred' });
      });
    }).catch(err => {
      var audit = Audit.createAudit('UNKNOWN_USER_PROFILE_FIND', { id: 0 }, {
        documentId: account.linkedId,
        email: data.email,
      });
      dao.AuditLog.insert(audit).catch(() => {});
      done();
    });
  }
}

module.exports = {
  checkToken: checkToken,
  createStagingRecord: createStagingRecord,
  forgotPassword: forgotPassword,
  linkAccount: linkAccount,
  register: register,
  resetPassword: resetPassword,
  sendFindProfileConfirmation: sendFindProfileConfirmation,
  sendUserCreateNotification: sendUserCreateNotification,
  sendUserPasswordResetNotification: sendUserPasswordResetNotification,
};
