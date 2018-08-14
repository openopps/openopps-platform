const koa = require('koa');
const log = require('log')('openopps');

const render = require('koa-ejs');
const serve = require('koa-static');
const path = require('path');
const md5File = require('md5-file');
const _ = require('lodash');

module.exports = async () => {
  // load environment variables and configuration
  global.openopps = require('./openopps-setup');

  const app = new koa();

  // load middlewares
  require('./middleware-setup')(app);

  // configure session and security
  require('./security-setup')(app);

  // for rendering .ejs views
  render(app, {
    root: path.join(__dirname, '../views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false,
  });

  // redirect any request coming other than openopps.hostName
  app.use(async (ctx, next) => {
    var hostParts = ctx.host.split(':');
    if(!openopps.redirect || hostParts[0] === openopps.hostName) {
      await next();
    } else {
      log.info('Redirecting from ' + ctx.host);
      var url = ctx.protocol + '://' + openopps.hostName + (hostParts[1] ? ':' + hostParts[1] : '') + ctx.path + (ctx.querystring ? '?' + ctx.querystring : '');
      ctx.status = 301;
      ctx.redirect(url);
    }
  });

  // configure serving resources
  require('./serve-resources')(app);

  // load our features (i.e. our api controllers)
  require('./features')(app);

  app.listen(openopps.port);
  console.log('App running at ' + openopps.hostName);
};
