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
const profile = require('../auth/profile');

const baseUser = {
  isAdmin: false,
  isAgencyAdmin: false,
  isCommunityAdmin: false,
  disabled: false,
  passwordAttempts: 0,
  completedTasks: 0,
};

const basePassport = {
  protocol: 'local',
};

function generatePasswordReset (user) {
  return {
    userId: user.id,
    token: uuid.v4(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function register (ctx, attributes, done) {
  attributes.username = attributes.username.toLowerCase().trim();
  attributes.agency_id = attributes.tags[0];
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
      await dao.UserPasswordReset.insert(generatePasswordReset(user)).then(async (obj) => {
        await createAudit('ACCOUNT_CREATED', ctx, { userId: user.id, status: 'successful' });
        return done(null, _.extend(user, { token: obj.token }));
      }).catch(async (err) => {
        log.info('Error creating password reset record', err);
        await createAudit('ACCOUNT_CREATED', ctx, { userId: user.id, status: 'failed' });
        return done(true);
      });
    }).catch(async (err) => {
      log.info('register: failed to create user ', attributes.username, err);
      await createAudit('ACCOUNT_CREATED', ctx, { userId: user.id, status: 'failed' });
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

async function resetPassword (ctx, token, password, done) {
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
        await dao.UserPasswordReset.update(token).then(async () => {
          await createAudit('PASSWORD_RESET', ctx, { userId: token.userId, status: 'successful' });
          done(null);
        });
      });
    }).catch(async (err) => {
      log.info('reset: failed to create or update passport ', token.email, err);
      await createAudit('PASSWORD_RESET', ctx, { userId: token.userId, status: 'failed' });
      done({ message: 'Failed to reset password.' });
    });
  });
}

async function forgotPassword (username, error) {
  if (!validator.isEmail(username)) {
    return done('Please enter a valid email address.');
  }
  await dao.User.findOne('username = ?', username).then(async (user) => {
    await dao.UserPasswordReset.insert(generatePasswordReset(user)).then((obj) => {
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
      return done({ message: 'Not a valid password reset code.'}, null);
    });
  }).catch((err) => {
    return done({ message: 'Not a valid password reset code.'}, null);
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

async function getProfileData (params, done) {
  await dao.AccountStaging.findOne('linked_id = ? ', params.id).then(async account => {
    if (bcrypt.compareSync([account.linkedId, account.uuid].join('|'), params.h)) {
      await profile.get(account.tokenset).then(async profile => {
        var user = _.extend(_.clone(baseUser), {
          username: profile.URI,
          name: _.filter([profile.GivenName, profile.MiddleName, profile.LastName], _.identity).join(' '),
          title: profile.Profile.JobTitle,
          givenName:profile.GivenName,
          lastName:profile.LastName,
          governmentUri: profile.Profile.GovernmentURI,
          linkedId: account.linkedId,      
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await dao.User.insert(user).then(async (user) => {
          await dao.AccountStaging.delete(account).catch(() => {});
          done(null, _.extend(user, { access_token: account.accessToken, id_token: account.idToken }));
        }).catch(done);
      }).catch(done);
    } else {
      done('Unauthorized');
    }
  }).catch(err => {
    done(err);
  });
}

async function linkAccount (user, data, done) {
  var account = await dao.AccountStaging.findOne('linked_id = ?', user.linkedId).catch(() => { return null; });
  if(!account || user.linkedId !== account.linkedId || !validate([account.linkedId, account.uuid, account.username], data.h)) {
    done({ message: 'This link is no longer valid.' });
  } else {
    await dao.User.findOne('lower(username) = ? and linked_id = \'\'', account.username.toLowerCase()).then(async u => {
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

async function sendFindProfileConfirmation (ctx, data, done) {
  var account = await dao.AccountStaging.findOne('linked_id = ?', data.id).catch(() => { return null; });
  if(!account || !validate([account.linkedId, account.uuid], data.h)) {
    done({ message: 'Invalid request' });
  } else {
    await dao.User.findOne('lower(username) = ?', data.email.toLowerCase()).then(async user => {
      if(user.linkedId) {
        notification.createNotification({
          action: 'find.profile.confirmation',
          model: { user: { name: user.name, username: user.username, governmentUri: user.governmentUri, linkedId: user.linkedId } },
        });
        done();
      } else {
        await dao.AccountStaging.update(_.extend(account, { username: user.username })).then(account => {
          notification.createNotification({
            action: 'find.profile.confirmation',
            model: {
              user: { name: user.name, username: user.username, governmentUri: user.governmentUri },
              hash: bcrypt.hashSync([account.linkedId, account.uuid, account.username].join('|'), 10),
            },
          });
          done();
        }).catch(err => {
          logError(userId, err);
          log.info('Error occured updating account staging record when sending find profile confirmation email.', err);
          done({ message: 'Unkown error occurred' });
        });
      }
    }).catch(async () => {
      await createAudit('UNKNOWN_USER_PROFILE_FIND', ctx, {
        documentId: account.linkedId,
        email: data.email,
      });
      done();
    });
  }
}

async function createAudit (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
}

async function logAuthenticationError (ctx, type, auditData) {
  await createAudit(type, ctx, auditData);
}

async function logError (userId, err) {
  dao.ErrorLog.insert({
    userId: userId,
    errorData: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
  }).catch();
}

module.exports = {
  checkToken: checkToken,
  createStagingRecord: createStagingRecord,
  forgotPassword: forgotPassword,
  getProfileData: getProfileData,
  linkAccount: linkAccount,
  logAuthenticationError: logAuthenticationError,
  logError: logError,
  register: register,
  resetPassword: resetPassword,
  sendFindProfileConfirmation: sendFindProfileConfirmation,
  sendUserCreateNotification: sendUserCreateNotification,
  sendUserPasswordResetNotification: sendUserPasswordResetNotification,
};
