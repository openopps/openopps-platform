const log = require('blue-ox')('app:authentication');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');
const passport = require('koa-passport');
const utils = require('../../utils');

const router = new Router();

function getMessage (err) {
  return (err === 'locked') ?
    'Your account has been locked, please reset your password.' :
    (err === 'invalid domain') ?
      'You need to have a .gov or .mil email address.' :
      'Invalid email address or password.';
}

router.post('/api/auth/local', async (ctx, next) => {
  await passport.authenticate('local', (err, user, info, status) => {
    if (err || !user) {
      log.info('Authentication Error: ', err);
      var message;
      if (err && err.originalError === 'invalid domain') {
        message = getMessage(err.originalError);
      } else {
        message = getMessage(err);
      }
      if (ctx.accepts('json')) {
        ctx.status = 401;
        return ctx.body = { message: message };
      } else {
        ctx.flash('message', message);
        return ctx.redirect('/');
      }
    } else {
      ctx.body = { success: true };
      return ctx.login(user);
    }
  })(ctx, next);
});

router.post('/api/auth/local/register', async (ctx, next) => {
  log.info('Register user', _.omit(ctx.request.body, 'password'));

  delete(ctx.request.body.isAdmin);
  delete(ctx.request.body.isAgencyAdmin);
  if (!ctx.request.body.username) {
    ctx.flash('error', 'Error.Passport.Username.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'No username was entered.' };
  }

  if (!ctx.request.body.password) {
    ctx.flash('error', 'Error.Passport.Password.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'No password was entered.' };
  }

  await service.register(ctx.request.body, function (err, user) {
    if (err) {
      ctx.flash('error', 'Error.Passport.Registration.Failed');
      ctx.status = 400;
      return ctx.body = { message: err.message || 'Registration failed.' };
    }
    try {
      service.sendUserCreateNotification(user, 'user.create.welcome');
    } finally {
      ctx.body = { success: true };
    }
    return ctx.login(user);
  });
});

router.post('/api/auth/forgot', async (ctx, next) => {
  if (!ctx.request.body.username) {
    ctx.flash('error', 'Error.Auth.Forgot.Email.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'You must enter an email address.'};
  }

  await service.forgotPassword(ctx.request.body.username.toLowerCase().trim(), function (token, err) {
    if (err) {
      ctx.status = 400;
      return ctx.body = { message: err };
    }
    try {
      service.sendUserPasswordResetNotification(ctx.request.body.username.toLowerCase().trim(), token, 'userpasswordreset.create.token');
    } finally {
      ctx.body = { success: true, email: ctx.request.body.username };
    }
  });
});

router.get('/api/auth/checkToken/:token', async (ctx, next) => {
  if (!ctx.params.token || ctx.params.token === 'null') {
    ctx.status = 400;
    return ctx.body = { message: 'Must provide a token for validation.' };
  } else {
    await service.checkToken(ctx.params.token.toLowerCase().trim(), (err, validToken) => {
      if (err) {
        ctx.status = 400;
        return ctx.body = err;
      } else {
        return ctx.body = validToken;
      }
    });
  }
});

router.post('/api/auth/reset', async (ctx, next) => {
  var token = ctx.request.body.token;
  var password = ctx.request.body.password;

  if (!token) {
    ctx.status = 400;
    ctx.body = { message: 'Must provide a token for validation.' };
  } else {
    await service.checkToken(token.toLowerCase().trim(), async (err, validToken) => {
      if (err) {
        ctx.status = 400;
        ctx.body = err;
      } else {
        if(utils.validatePassword(password, validToken.email)) {
          await service.resetPassword(validToken, password, function (err) {
            if (err) {
              ctx.status = 400;
              ctx.body = { message: err.message || 'Password reset failed.' };
            } else {
              ctx.body = { success: true };
            }
          });
        } else {
          ctx.status = 400;
          ctx.body = { message: 'Password does not meet password rules.' };
        }
      }
    });
  }
});

router.get('/api/auth/logout', async (ctx, next) => {
  ctx.body = { success: true };
  return ctx.logout();
});

module.exports = router.routes();
