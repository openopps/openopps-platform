/**
 * AuthController
 *
 * @description :: Server-side logic for handling authentication requests
 */

var userUtils = require('../services/utils/user');
url = require('url');

module.exports = {
	/**
   * Log out a user and return them to the homepage
   *
   * Passport exposes a logout() function on req (also aliased as logOut()) that
   * can be called from any route handler which needs to terminate a login
   * session. Invoking logout() will remove the req.user property and clear the
   * login session (if any).
   *
   * For more information on logging out users in Passport.js, check out:
   * http://passportjs.org/guide/logout/
   *
   * @param {Object} req
   * @param {Object} res
   */
  logout: function (req, res) {
    req.logout();

    // mark the user as logged out for auth purposes
    req.session.authenticated = false;

    if (req.param('json')) {
      res.send({ logout: true });
    } else {
      res.redirect(sails.config.ui.home.logged_in_path);
    }

  },

  /**
   * Create a third-party authentication endpoint
   *
   * @param {Object} req
   * @param {Object} res
   */
  provider: function (req, res) {
    var path = req.headers.referer
          .split('://')[1]
          .split(req.headers.host)[1];

    // Set referer path for redirection after authentication
    req.session.logged_in_path = path;

    passport.endpoint(req, res);
  },

  /**
   * Create a authentication callback endpoint
   *
   * This endpoint handles everything related to creating and verifying Pass-
   * ports and users, both locally and from third-aprty providers.
   *
   * Passport exposes a login() function on req (also aliased as logIn()) that
   * can be used to establish a login session. When the login operation
   * completes, user will be assigned to req.user.
   *
   * For more information on logging in users in Passport.js, check out:
   * http://passportjs.org/guide/login/
   *
   * @param {Object} req
   * @param {Object} res
   */
  callback: function (req, res) {
    sails.log.verbose('AuthController.callback', req.params)
    function tryAgain (err) {

      // Only certain error messages are returned via req.flash('error', someError)
      // because we shouldn't expose internal authorization errors to the user.
      // We do return a generic error and the original request body.
      var flashError = req.flash('error')[0];

      if (err && !flashError ) {
        req.flash('error', 'Error.Passport.Generic');
      } else if (flashError) {
        req.flash('error', flashError);
      }
      req.flash('form', req.body);

      sails.log.verbose('Authentication Error:', err, flashError);

      var message = (err === 'locked') ?
            'Your account has been locked, please reset your password.' :
            (err === 'invalid domain') ?
            'You need to have a .gov or .mil email address.' :
            'Invalid email address or password.';

      sails.log.verbose('error message:', message);

      if (req.param('json')) {
        return res.send(403, { message: message });
      } else {
        req.flash('message', message);
        return res.redirect('/');
      }

    }

    passport.callback(req, res, function (err, user, challenges, statuses) {
      if (err || !user) {
        sails.log.verbose('Authentication Error:', err);
        if (err === 'locked') return tryAgain(err);
        if (err === 'invalid domain') return tryAgain(err);
        if (err && err.originalError === 'invalid domain') return tryAgain(err.originalError);
        return tryAgain(challenges);
      }

      req.login(user, function (err) {
        if (err) return tryAgain(err);

        var path, u;

        // Mark the session as authenticated to work with default Sails sessionAuth.js policy
        req.session.authenticated = true;

        if (req.param('json')) {
          res.send(user);
        } else {
          // After successful login, redirect the user to the
          // previous page (if that page is not the home page),
          // or to the default logged_in_path from the UI config.
          // Also, force the browser to reload to get backendUser data.
          // source: http://stackoverflow.com/a/20389831
          path = (req.session.logged_in_path &&
            req.session.logged_in_path !== '/') ?
            req.session.logged_in_path :
            sails.config.ui.home.logged_in_path;
          u = url.parse(path, true, false);
          u.query.v = +new Date(); // add versioning to bust cache
          delete u.search;
          delete req.session.logged_in_path;

          return res.redirect(url.format(u));
        }

      });
    });
  },

  /**
   * Disconnect a passport from a user
   *
   * @param {Object} req
   * @param {Object} res
   */
  disconnect: function (req, res) {
    if (!req.param('provider')) return res.badRequest();
    passport.disconnect(req, res, function(err, user) {
      if (err) return res.serverError(err);
      res.send(user);
    });
  },

  /**
   * Password reset controllers
   */
  forgot: function (req, res) {
    var email = req.param('username');
    sails.log.verbose('AuthController.forgot', email);
    if (!email || email === '') {
      return res.send(400, { message: 'You must enter an email address.'});
    }
    User.forgotPassword(email)
    .then(function(token) {
      sails.log.verbose('forgotPassword success, token:', token)
      var result = {
        success: true,
        email: email
      };
      return res.send(result);
    })
    .catch(function(err) {
      return res.send(400, {message: err});
    });
  },
  /**
   * Check if a token is a valid token for resetting a user's password.
   *
   * @return true if the token is valid, false otherwise
   */
  checkToken: function (req, res) {
    var token = req.route.params.id;
    if (!token) {
      token = req.param('token');
    }
    if (!token) {
      return res.send(400, { message: 'Must provide a token for validation.' });
    }
    UserPasswordReset.checkToken(token, function (err, valid, validToken) {
      if (err) { return res.send(400, { message: 'Error looking up token.', err:err }); }
      if (valid === true) {
        User.findOneById(validToken.userId, function (err, validUser) {
          if (err) { return res.send(400, { message: 'Error looking up user.', err:err }); }
          validToken.email = validUser.username;
          return res.send(validToken);
        });
        return;
      }
      return res.send(403, { message: 'This is not a valid token.'} );
    });
  },
  /**
   * Reset a user's password
   * The input to this must be a valid code and a new valid password
   */
  reset: function (req, res) {
    var token = req.param('token'),
        password = req.param('password');

    if (!token) return res.send(400, {
      message: 'Must provide a token for validation.'
    });

    UserPasswordReset.checkToken(token, function (err, valid, validToken) {
      if (err) return res.send(400, {
        message: 'Error looking up token.',
        err: err
      });
      if (valid !== true) return res.send(403, {
        message: 'This is not a valid token.'
      });

      // look up the user
      User.findOneById(validToken.userId).exec(function (err, validUser) {
        if (err) return res.send(400, {
          message: 'Error looking up user.',
          err:err
        });

        // validate the password rules
        var rules = userUtils.validatePassword(validUser.username, password),
            success = true;

        _.each(_.values(rules), function (v) {
          success = success && v;
        });

        if (success !== true) return res.send(400, {
          message: 'Password does not meet password rules.'
        });

        Passport.findOrCreate({
          user: validUser.id,
          protocol: 'local'
        }).exec(function(err, passport) {
          passport.password = password;
          passport.save(function (err, newPasswordObj) {
            if (err) return res.send(400, {
              message: 'Error storing new password.'
            });

            // destroy the existing token
            validToken.destroy(function (err) {
              if (err) return res.send(400, {
                message: 'Error destroying existing token'
              });

              // Reset login
              validUser.passwordAttempts = 0;
              validUser.save(function(err, user) {
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
      });
    });
  }

};
