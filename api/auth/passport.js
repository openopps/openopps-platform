const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const log = require('log')('app:passport');
const db = require('../../db');
const dao = require('./dao')(db);
const bcrypt = require('bcryptjs');
const path = require('path');

const localStrategyOptions = {
  usernameField: 'identifier',
  passwordField: 'password',
};

function validatePassword (password, hash) {
  return bcrypt.compareSync(password, hash);
}

async function fetchUser (id) {
  return await dao.User.query(dao.query.user, id, dao.options.user).then(async results => {
    var user = results[0];
    if(user) {
      user.isOwner = true;
      user.badges = await dao.Badge.find('"user" = ?', user.id, dao.options.badge);
      user = dao.clean.user(user);
    }
    return user;
  }).catch(err => {
    log.info('Fetch user error', err);
    return null;
  });
}

async function fetchPassport (user, protocol) {
  return (await dao.Passport.find('"user" = ? and protocol = ? and "deletedAt" is null', user, protocol))[0];
}

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
  var user = await fetchUser(id);
  done(null, user);
});

passport.use(new LocalStrategy(localStrategyOptions, async (username, password, done) => {
  var maxAttempts = openopps.auth.local.passwordAttempts;
  log.info('local login attempt for:', username);
  await dao.User.findOne('username = ?', username.toLowerCase().trim()).then(async (user) => {
    if (maxAttempts > 0 && user.passwordAttempts >= maxAttempts) {
      log.info('max passwordAttempts (1)', user.passwordAttempts, maxAttempts);
      done('locked', false);
    } else {
      var passport = await fetchPassport(user.id, 'local');
      if (passport) {
        if (!validatePassword(password, passport.password)) {
          user.passwordAttempts++;
          dao.User.update(user).then(() => {
            if (maxAttempts > 0 && user.passwordAttempts >= maxAttempts) {
              log.info('max passwordAttempts (2)', user.passwordAttempts, maxAttempts);
              done('locked', false);
            }
            log.info('Error.Passport.Password.Wrong');
            done(null, false);
          }).catch(err => {
            done(err, false);
          });
        } else {
          await dao.User.update({
            id: user.id,
            passwordAttempts: 0,
            updatedAt: new Date(),
          }).catch(err => {
            log.info('Error resetting password attempts');
          });
          done(null, user);
        }
      } else {
        log.info('Error.Passport.Password.NotSet');
        done(new Error('Passport not found'), false);
      }
    }
  }).catch(err => {
    log.info('Error.Passport.Username.NotFound', username, err);
    done(new Error('Username not found.'), false);
  });
}));

if(openopps.auth.oidc) {
  const { Strategy } = require('openid-client');
  var OpenIDStrategyOptions = {
    client: openopps.auth.oidc,
    params: {
      redirect_uri: openopps.httpProtocol + '://' + openopps.hostName + '/api/auth/oidc/callback',
      scope: 'openid profile email phone address',
    },
    //usePKCE: 'S256',
  };
  passport.use('oidc', new Strategy(OpenIDStrategyOptions, (tokenset, userinfo, done) => {
    if(tokenset.claims['usaj:hiringPath'] != 'fed' || !tokenset.claims['usaj:governmentURI']) {
      // TODO: Add unauthorized attempt to access OpenOpps to audit_log
      done('Not authorized');
    } else {
      dao.User.findOne('username = ?', tokenset.claims['usaj:governmentURI']).then(user => {
        done(null, user);
      }).catch(err => {
        done(err);
      });
    }
  }));
}