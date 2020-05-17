const jwt = require('jsonwebtoken');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwksRsa = require('jwks-rsa');
const log = require('log')('app:passport');
const db = require('../../db');
const dao = require('./dao')(db);
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const Profile = require('./profile');
const Login = require('./login');
const Agency = require('../model/Agency');

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
    if (user) {
      user.isOwner = true;
      user.communityAdmin = await dao.CommunityUser.find('user_id = ? and is_manager = ?', user.id, true);
      user.isCommunityAdmin = user.communityAdmin.length > 0;
      user.communityApprover = await dao.CommunityUser.find('user_id = ? and is_approver = ?', user.id, true);
      user.isCommunityApprover = user.communityApprover.length > 0;
      user.badges = await dao.Badge.find('"user" = ?', user.id, dao.options.badge);
      var GetCommunities = require('../opportunity/service').getCommunities;
      user.communities = await GetCommunities(user.id);
      user.bureauOffice= (await db.query(dao.query.userBureauOffice, user.id)).rows;
      if (user.agencyId) {
        user.agency = await Agency.fetchAgency(user.agencyId).catch(() => { return {}; });
        user.agencies = Agency.toList(user.agency);
      }
      
      user = dao.clean.user(user);
      var GetInternshipsCompleted = require('../user/service').getCompletedInternship;
      user.internshipsCompleted = await GetInternshipsCompleted(user.id);
      user.editURL = openopps.usajobsURL + '/Applicant/Profile/ClientRouter?clientID=' + openopps.auth.loginGov.clientID;
      if (user.hiringPath == 'fed' || user.hiringPath == 'contractor') {
        user.editURL += '&rp=government_uri';
      }
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
  done(null, {
    id: user.id,
    tokenset: user.tokenset,
  });
});

passport.deserializeUser(async function (userObj, done) {
  var user = await fetchUser(userObj.id);
  user.tokenset = userObj.tokenset;
  done(null, user);
});

passport.use(new LocalStrategy(localStrategyOptions, async (username, password, done) => {
  var maxAttempts = openopps.auth.local.passwordAttempts;
  log.info('local login attempt for:', username);
  await dao.User.findOne('username = ?', username.toLowerCase().trim()).then(async (user) => {
    if (maxAttempts > 0 && user.passwordAttempts >= maxAttempts) {
      log.info('max passwordAttempts (1)', user.passwordAttempts, maxAttempts);
      done({ message: 'locked', data: { userId: user.id } }, false);
    } else {
      var passport = await fetchPassport(user.id, 'local');
      if (passport) {
        if (!validatePassword(password, passport.password)) {
          user.passwordAttempts++;
          dao.User.update(user).then(() => {
            if (maxAttempts > 0 && user.passwordAttempts >= maxAttempts) {
              log.info('max passwordAttempts (2)', user.passwordAttempts, maxAttempts);
              done({ message: 'locked', data: { userId: user.id } }, false);
            } else {
              log.info('Error.Passport.Password.Wrong');
              done({ data: { userId: user.id } }, false);
            }
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
        done({ data: { userId: user.id } }, false);
      }
    }
  }).catch(err => {
    log.info('Error.Passport.Username.NotFound', username, err);
    done({ message: 'Username not found.' }, false);
  });
}));

if (openopps.auth.oidc) {
  const { Strategy } = require('openid-client');
  var OpenIDStrategyOptions = {
    client: openopps.auth.oidc,
    params: {
      redirect_uri: openopps.httpProtocol + '://' + openopps.hostName + '/api/auth/oidc/callback',
      scope: 'openid profile email phone address opendataread offline_access',
    },
  };
  passport.use('oidc', new Strategy(OpenIDStrategyOptions, (tokenset, userinfo, done) => {
    if (tokenset.claims['usaj:governmentURI']) {
      Login.removeDuplicateFederalURI(tokenset);
    }
    if (tokenset.claims['usaj:governmentURI']) {
      Login.processFederalLogin(tokenset, done);
    } else if (tokenset.claims['usaj:hiringPath'] == 'student') {
      Login.processStudentLogin(tokenset, done);
    } else {
      Login.processIncompleteProfile(tokenset, done);
    }
  }));

  const handleSigningKeyError = (err, cb) => {
    // If we didn't find a match, can't provide a key.
    if (err && err.name === 'SigningKeyNotFoundError') {
      return cb(null);
    }

    // If an error occured like rate limiting or HTTP issue, we'll bubble up the error.
    if (err) {
      return cb(err);
    }
  };

  var passportJwtSecret = function (options) {
    if (options === null || options === undefined) {
      throw new Error('An options object must be provided when initializing passportJwtSecret');
    }

    const client = new jwksRsa(options);
    const onError = options.handleSigningKeyError || handleSigningKeyError;

    return function secretProvider (req, rawJwtToken, cb) {
      const decoded = jwt.decode(rawJwtToken, { complete: true });

      // Only RS256 is supported.
      if (!decoded || !decoded.header || decoded.header.alg !== 'RS256') {
        return cb(null, null);
      }

      client.getSigningKey(decoded.header.kid, (err, key) => {
        if (err) {
          console.log(err);
          return onError(err, (newError) => cb(newError, null));
        }

        // Provide the key.
        return cb(null, key.publicKey || key.rsaPublicKey);
      });
    };
  };

  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), ExtractJwt.fromHeader('x-authorization')]);
  opts.secretOrKeyProvider = passportJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: openopps.auth.oidc.issuer.jwks_uri,
    strictSsl: false,
  });
  opts.issuer = openopps.auth.oidc.issuer.issuer;
  opts.audience = opts.issuer + '/resources';
  passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    try {
      if (!jwt_payload.scope.includes('openopps'))
      {
        return done(new Error('Scope error'), null);
      }
      dao.User.findOne('linked_id = ?', jwt_payload.sub).then(user => {
        user.jwt_payload = jwt_payload;
        console.log('user found');
        done(null, user);
      }).catch(err => {
        done(new Error('User not found'), null);
      });
    } catch (err) {
      return done(err, null);
    }
  }),
  );
}
