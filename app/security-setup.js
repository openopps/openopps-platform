const csp = require('koa-csp');
const CSRF = require('koa-csrf');
const session = require('koa-generic-session');
const redisStore = require('koa-redis');
const passport = require('koa-passport');

const policy = {
  'default-src': ['self'],
  'connect-src': [
    'self',
    '*.usajobs.gov',
  ],
  'img-src': [
    'self',
    '*.google-analytics.com',
  ],
  'script-src': [
    'self',
    '*.googletagmanager.com',
    '*.google-analytics.com',
    '*.usajobs.gov',
    'unsafe-inline',
    'unsafe-eval',
  ],
  'style-src': [
    'self',
    'unsafe-inline',
  ],
};

const csrfOptions = {
  invalidSessionSecretMessage: { message: 'Invalid session' },
  invalidSessionSecretStatusCode: 401,
  invalidTokenMessage: JSON.stringify({ message: 'Invalid CSRF token' }),
  invalidTokenStatusCode: 401,
  excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
  disableQuery: true,
};

module.exports = async (app) => {
  // configure session
  app.proxy = true;
  app.keys = [openopps.session.secret || 'your-secret-key'];
  app.use(session(openopps.session, app));

  // initialize authentication
  if(openopps.auth.loginGov && openopps.auth.loginGov.enabled) {
    openopps.auth.oidc = await require('../api/auth/loginGov');
    if(!openopps.auth.oidc) {
      throw new Error('Application failed to start: Unable to establish OpenID Client connection.');
    }
  }
  require('../api/auth/passport');
  app.use(passport.initialize());
  app.use(passport.session());

  // configure receiving AWS SNS messages prior to CSRF configuration
  app.use(require('../api/notification/controller'));

  // configure CSRF
  app.use(new CSRF(csrfOptions));

  // GET CSRF Token
  app.use(async (ctx, next) => {
    if(ctx.path === '/csrfToken') {
      ctx.cacheControl = openopps.cache.noStore;
      ctx.body = { _csrf: ctx.csrf };
    } else await next();
  });

  // configure Content-Security-Policy
  app.use(csp({ policy: policy }));
};