const log = require('log')('app:authentication');
const Router = require('koa-router');
const _ = require('lodash');
const request = require('request');
const service = require('./service');
const passport = require('koa-passport');
const utils = require('../../utils');
const validGovtEmail = require('../model').ValidGovtEmail;

const router = new Router();

function getMessage (err) {
  return (err === 'locked') ?
    'Your account has been locked, please reset your password.' :
    (err === 'invalid domain') ?
      'You need to have a .gov or .mil email address.' :
      'Invalid email address or password.';
}

async function useLocalAuthentication (ctx, next) {
  await passport.authenticate('local', (err, user, info, status) => {
    if (info) {
      service.logAuthenticationError(ctx, 'ACCOUNT_LOGIN', { status: 'info' });
      ctx.status = 401;
      return ctx.body = { message: 'Invalid email address or password.' };
    } else if (err || !user) {
      service.logAuthenticationError(ctx, 'ACCOUNT_LOGIN', _.extend(err.data, { 
        status: (err.message == 'locked' ? 'locked' : 'failed'),
      }));
      log.info('Authentication Error: ', err);
      var message = getMessage(err.message);
      if (ctx.accepts('json')) {
        ctx.status = 401;
        return ctx.body = { message: message };
      } else {
        ctx.flash('message', message);
        return ctx.redirect('/');
      }
    } else {
      service.logAuthenticationError(ctx, 'ACCOUNT_LOGIN', { userId: user.id, status: 'successful' });
      ctx.body = { success: true };
      return ctx.login(user);
    }
  })(ctx, next);
}

function loginUser (state, user, ctx) {
  ctx.login(user).then(() => {
    ctx.redirect(state.redirect ? ('/' + state.redirect) : ctx.state.user.hiringPath == 'student' ? '/search': '/home');
    service.logAuthenticationError(ctx, 'ACCOUNT_LOGIN', { userId: user.id, status: 'successful' });
  }).catch((err) => {
    service.logAuthenticationError(ctx, 'ACCOUNT_LOGIN', { userId: user.id, status: 'failed' });
    ctx.redirect('/');
  });
}

function loginError (ctx, err) {
  if(err.message == 'Not authorized') {
    service.logAuthenticationError(ctx, 'UNAUTHORIZED_APPLICATION_ACCESS', err.data);
    ctx.status = 403;
    ctx.redirect('/unauthorized');
  } else if (err.message == 'Incomplete profile') {
    ctx.redirect('/welcome?u=' + new Buffer(JSON.stringify(err.data)).toString('base64'));
  } else {
    log.info('Authentication Error: ', err);
    ctx.status = 503;
  }
}

async function processState (state, user, ctx) {
  if(state.action == 'link') {
    await service.linkAccount(user, state.data, (err, user) => {
      if(err) {
        ctx.status = 400;
        ctx.redirect('/expired');
      } else {
        loginUser(state, user, ctx);
      }
    });
  } else {
    await service.createStagingRecord(user, (err, account) => {
      if(err) {
        ctx.status = 400;
      } else {
        ctx.redirect(state.redirect ? ('/' + state.redirect) : ('/profile/find?id=' + account.linkedId + '&h=' + account.hash));
      }
    });
  }
}

router.post('/api/auth/user', async (ctx, next) => {
  await service.getProfileData(ctx.request.body, async (err, user) => {
    if(err) {
      ctx.status = 400;
    } else {
      await ctx.login(user);
      ctx.body = ctx.state.user;
    }
  });
});

router.post('/api/auth', async (ctx, next) => {
  if(openopps.auth.loginGov.enabled) {
    ctx.redirect('/api/auth/oidc');
  } else {
    await useLocalAuthentication(ctx, next);
  }
});

router.get('/api/auth/oidc', async (ctx, next) => {
  await passport.authenticate('oidc', { state: JSON.stringify({ action: 'login', redirect: ctx.querystring }) })(ctx, next);
});

router.get('/api/auth/oidc/callback', async (ctx, next) => {
  await passport.authenticate('oidc', async (err, user, info, status) => {
    if (err || !user) {
      loginError(ctx, err);
    } else if(user.type == 'staging') {
      await processState(JSON.parse(ctx.query.state), user, ctx);
    } else {
      loginUser(JSON.parse(ctx.query.state), user, ctx);
    }
  })(ctx, next);
});

router.post('/api/auth/find', async (ctx, next) => {
  await service.sendFindProfileConfirmation(ctx, ctx.request.body, (err) => {
    if(err) {
      ctx.status = 400;
      return ctx.body = { message: err };
    } else {
      ctx.body = { message: 'success' };
    }
  });
});

router.get('/api/auth/link', async (ctx, next) => {
  var state = { 
    action:'link',
    data: {
      h: ctx.query.h,
    },
  };
  await passport.authenticate('oidc', { state: JSON.stringify(state) })(ctx, next);
});

router.post('/api/auth/register', async (ctx, next) => {
  log.info('Register user', ctx.request.body);

  delete(ctx.request.body.isAdmin);
  delete(ctx.request.body.isAgencyAdmin);
  if (!ctx.request.body.uri) {
    ctx.flash('error', 'Error.Passport.uri.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'The email address is required.' };
  } else if (!validGovtEmail(ctx.request.body.uri)) {
    ctx.status = 400;
    return ctx.body = { message: 'The email address provided is not a valid government email address.' };
  }

  await service.register(ctx, ctx.request.body, function (err, user) {
    if (err) {
      ctx.status = 400;
      return ctx.body = { message: err.message || 'Registration failed.' };
    }
    try {
      service.sendUserCreateNotification(user, 'user.create.welcome');
    } finally {
      ctx.body = { success: true };
    }
  });
});

router.post('/api/auth/forgot', async (ctx, next) => {
  if (!ctx.request.body.uri) {
    ctx.flash('error', 'Error.Auth.Forgot.Email.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'You must enter an email address.'};
  }

  await service.forgotPassword(ctx.request.body.uri.toLowerCase().trim(), function (token, err) {
    if (err) {
      ctx.status = 400;
      return ctx.body = { message: err };
    }
    try {
      service.sendUserPasswordResetNotification(ctx.request.body.uri.toLowerCase().trim(), token, 'userpasswordreset.create.token');
    } finally {
      ctx.body = { success: true, email: ctx.request.body.uri };
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
    service.logAuthenticationError(ctx, 'PASSWORD_RESET', { status: 'failed - no token' });
    ctx.status = 400;
    ctx.body = { message: 'Must provide a token for validation.' };
  } else {
    await service.checkToken(token.toLowerCase().trim(), async (err, validToken) => {
      if (err) {
        service.logAuthenticationError(ctx, 'PASSWORD_RESET', { status: 'failed - invalid token' });
        ctx.status = 400;
        ctx.body = err;
      } else {
        if(utils.validatePassword(password, validToken.email)) {
          await service.resetPassword(ctx, validToken, password, function (err) {
            if (err) {
              ctx.status = 400;
              ctx.body = { message: 'Password reset failed.' };
            } else {
              ctx.body = { success: true };
            }
          });
        } else {
          service.logAuthenticationError(ctx, 'PASSWORD_RESET', { userId: validToken.userId, status: 'failed - rules' });
          ctx.status = 400;
          ctx.body = { message: 'Password does not meet password rules.' };
        }
      }
    });
  }
});

router.get('/api/auth/logout', async (ctx, next) => {
  var response = { success: true };
  if(openopps.auth.oidc) {
    response.redirectURL = openopps.auth.oidc.endSessionUrl({
      post_logout_redirect_uri: openopps.httpProtocol + '://' + openopps.hostName + '/loggedOut',
      id_token_hint: ctx.session.passport.user.id_token,
    });
  }
  ctx.logout();
  ctx.body = response;
});

module.exports = router.routes();
