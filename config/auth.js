// Set up passport for authentication
var       passport = require('passport')
         , request = require('request')
   , LocalStrategy = require('passport-local').Strategy
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
   , MyUSAStrategy = require('passport-myusa').Strategy
, LinkedInStrategy = require('passport-linkedin').Strategy;

var authSettings   = require('./settings/auth.js');
var userUtils      = require('../api/services/utils/user.js');

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Set up authentication strategies here.
// You will also need to:
// - Add necessary routes to routes.js as /login/foo
// - Add logic to have passport authenticate in your route in AuthController.js

// LocalStrategy - Primarily for testing (non-OAuth provider)
passport.use('local', new LocalStrategy(
  function (username, password, done) {
    userUtils.findLocalUser(username, password, done);
  }
));

passport.use('register', new LocalStrategy(
  function (username, password, done) {
    userUtils.createLocalUser(username, password, done);
  }
));

// SSPI LocalStrategy - (DoS non-OAuth provider)
passport.use('sspi', new LocalStrategy({
    passReqToCallback: true,
  },
  function (req, username, password, done) {
    // get username and domain from request
    console.log('SSPI req object:', req.sspi);
    console.log('Username:', username);
    console.log('Password:', password);
    request.get({url: sails.config.auth.auth.sspi.contentUrl,
                 json: true,
                 qs: { username: req.sspi.rawUser, domain: password }
                }, function (err, req2, providerUsers) {
      if (!providerUsers) {
        return done(null, false, { message: 'An error occurred while loading user information.' });
      }
      var user = providerUsers.users.pop();
      user = user || {};
      // map fields to what passport expects for profiles
      user.id = user.id;
      user.emails = [ {value: user.email, type: 'work'} ];
      user.displayName = user.fullname;
      user.photoUrl = user.image;
      user.skill = user.skills.tags;
      user.topic = user.proftags.tags;
      // check if the settings should be overwritten
      if (sails.config.auth.auth.sspi.overwrite === true) {
        user.overwrite = true;
      }
      // Send through standard local user creation flow
      userUtils.createLocalUser(username, password, user, req, done);
    });
  }
));

// OAuthStrategy - Generic OAuth Client implementation
// Initially configured with credentials to talk to the
// example server provided by OAuth2orize.
// https://github.com/jaredhanson/oauth2orize
passport.use('oauth2', new OAuth2Strategy({
    authorizationURL: 'http://localhost:3000/dialog/authorize',
    tokenURL: 'http://localhost:3000/oauth/token',
    clientID: 'abc123',
    clientSecret: 'ssh-secret',
    callbackURL: 'http://localhost:1337/api/auth/oauth2/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    // fetch user profile
    request.get({url: 'http://localhost:3000/api/userinfo',
                 headers: {'Authorization': 'Bearer: ' + accessToken },
                 json:true
                }, function (err, req, providerUser) {
      if (!providerUser) { return done(null, false, { message: 'An error occurred while loading user information.' });}
      // map fields to what passport expects for profiles
      providerUser.id = providerUser.user_id;
      providerUser.emails = [ {value: providerUser.email, type:'work'} ];
      providerUser.displayName = providerUser.name;
      providerUser.photoUrl = providerUser.photo;
      // Send through standard OAuth token flow to store credentials
      userUtils.createOauthUser(
        'oauth2',
        { accessToken: accessToken,
          refreshToken: refreshToken },
        providerUser,
        done
      );
    })
  }
));

// Use the MyUSAStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and MyUSA
//   profile), and invoke a callback with a user object.
passport.use('myusa', new MyUSAStrategy({
    passReqToCallback: true,
    clientID: authSettings.auth.myusa.clientId,
    clientSecret: authSettings.auth.myusa.clientSecret,
    callbackURL: authSettings.auth.myusa.callbackUrl,
    // Initially use staging.my.usa.gov until app approved for production
    authorizationURL: 'https://qa.my.usa.gov/oauth/authorize',
    tokenURL: 'https://qa.my.usa.gov/oauth/authorize',
    profileURL: 'https://qa.my.usa.gov/api/profile'
    // For testing:
    //authorizationURL: 'http://172.23.195.136:3000/oauth/authorize',
    //tokenURL: 'http://172.23.195.136:3000/oauth/authorize',
    //profileURL: 'http://172.23.195.136:3000/api/profile'
  },
  function (req, accessToken, refreshToken, profile, done) {
    var name = profile.firstname + ' ' + profile.lastname;
    name = name.trim();
    if (name) {
      profile.displayName = name;
    }
    if (sails.config.auth.auth.myusa.overwrite === true) {
      profile.overwrite = true;
    }
    userUtils.createOauthUser(
      'myusa',
      req,
      { accessToken: accessToken,
        refreshToken: refreshToken },
      profile,
      done
    );
  }
));

// Use the LinkedIn within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and MyUSA
//   profile), and invoke a callback with a user object.
passport.use('linkedin', new LinkedInStrategy({
    passReqToCallback: true,
    profileFields: [
      'id',
      'first-name',
      'last-name',
      'formatted-name',
      'email-address',
      'headline',
      'picture-url',
      'picture-urls::(original)',
      'location:(name)',
      'summary',
      'skills',
      'interests',
      'three-current-positions'
    ],
    consumerKey: authSettings.auth.linkedin.clientId,
    consumerSecret: authSettings.auth.linkedin.clientSecret,
    callbackURL: authSettings.auth.linkedin.callbackUrl
  },
  function (req, accessToken, refreshToken, profile, done) {
    // parse profile data to standard format
    // take standard low-res photo
    if (profile._json.pictureUrl) {
      profile.photoUrl = profile._json.pictureUrl;
    }
    // upgrade to higher res photo if its available
    if (profile._json.pictureUrls && (profile._json.pictureUrls._total > 0)) {
      profile.photoUrl = profile._json.pictureUrls.values[0];
    }
    // bio
    if (profile._json.summary) {
      profile.bio = profile._json.summary;
    }
    // current company and title
    if (profile._json.threeCurrentPositions && (profile._json.threeCurrentPositions._total > 0)) {
      profile.company = profile._json.threeCurrentPositions.values[0].company.name;
      profile.title = profile._json.threeCurrentPositions.values[0].title;
    }
    // location
    if (profile._json.location) {
      profile.location = profile._json.location.name;
    }
    // parse skills
    profile.skill = [];
    if (profile._json.skills && (profile._json.skills._total > 0)) {
      _.each(profile._json.skills.values, function (s) {
        profile.skill.push(s.skill.name);
      });
    }
    // parse topics
    profile.topic = [];
    if (profile._json.interests) {
      _.each(profile._json.interests.split(','), function (i) {
        i = i.trim();
        if (i.toLowerCase().substring(0,4) == 'and ') {
          i = i.slice(3).trim();
        }
        if (i.substring(0,1) == '&') {
          i = i.slice(1).trim();
        }
        profile.topic.push(i);
      });
    }
    if (sails.config.auth.auth.linkedin.overwrite === true) {
      profile.overwrite = true;
    }
    // Linked in profile is complete; now authenticate user
    userUtils.createOauthUser(
      'linkedin',
      req,
      { accessToken: accessToken,
        refreshToken: refreshToken },
      profile,
      done
    );
  }
));

