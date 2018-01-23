const _ = require ('lodash');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const uuid = require('uuid');
const log = require('blue-ox')('app:auth:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const userService = require('../user/service');

const baseUser = {
  isAdmin: false,
  isAgencyAdmin: false,
  disabled: false,
  passwordAttempts: 0,
  completedTasks: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const basePassport = {
  protocol: 'local',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function register (attributes, done) {
  if (!attributes.password || attributes.password === '') {
    return done(new Error('password may not be blank'));
  }
  attributes.username = username.toLowerCase().trim();
  await dao.User.insert(_.extend(_.clone(baseUser), attributes)).then(async (user) => {
    log.info('created user', _.omit(user, 'password'));

    var tags = attributes.tags || attributes['tags[]'] || [];
    await userService.processUserTags(user, tags).then(tags => {
      user.tags = tags;
    });
    var passport = {
      user: user.id,
      password: await bcrypt.hash(attributes.password, 10),
      accessToken: crypto.randomBytes(48).toString('base64'),
    };
    await dao.Passport.insert(_.extend(_.clone(basePassport), passport)).then(passport => {
      log.info('created passport', _.omit(passport, ['password', 'accessToken']));
    }).catch(err => {
      log.info('register: failed to create passport ', attributes.username, err);
    });
    return done(null, user);
  }).catch(err => {
    log.info('register: failed to create user ', attributes.username, err);
    return done(true);
  });
}

async function sendUserCreateNotification (user, action) {
  var data = {
    action: action,
    model: {
      name: user.name,
      username: user.username,
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

module.exports = {
  register: register,
  forgotPassword: forgotPassword,
  checkToken: checkToken,
  resetPassword: resetPassword,
  sendUserCreateNotification: sendUserCreateNotification,
  sendUserPasswordResetNotification: sendUserPasswordResetNotification,
};
