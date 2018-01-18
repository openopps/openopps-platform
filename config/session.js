const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const dbURL = appEnv.getServiceURL('psql-openopps') || process.env.DATABASE_URL;
const redisCreds = appEnv.getServiceCreds('redis-openopps');
var session = {

  /* Session secret is automatically generated when your new app is created
   * Replace at your own risk in production-- you will invalidate the cookies of your users,
   * forcing them to log in again.
   */
  secret: process.env.SAILS_SECRET,

  /* Set the cookie maximum age (timeout).
   * If this is not set, then cookies will persist forever.
   * Setting this to null will make cookies non-persistent.
   */
  cookie: {
    maxAge: null,
  },
  /* Set the session store's expiration time.
   * This is different from cookie.maxAge, setting
   * this to null to get ttl from cookie.maxAge.
   */
  ttl: 35 * 60 * 1000, // 35 minutes

  /* Force a session identifier cookie to be set on every response.
   * The expiration is reset to the original maxAge, resetting the
   * expiration countdown. Default is false.
   */
  rolling: true,
};

// Use redis for sessions
if (redisCreds) {
  session.store = require('koa-redis')({
    host: redisCreds.hostname,
    port: redisCreds.port,
    password: redisCreds.password,
  });
} else if (process.env.NODE_ENV === 'development' && process.env.REDIS) {
  session.store = require('koa-redis')({});
}

module.exports.session = session;
