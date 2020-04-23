const render = require('koa-ejs');
const serve = require('koa-static');
const path = require('path');
const md5File = require('md5-file');

const data = {
  systemName:  openopps.systemName,
  draftAdminOnly: openopps.draftAdminOnly,
  loginGov: openopps.auth.loginGov.enabled,
  version: openopps.version,
  usajobsURL: openopps.usajobsURL,
  usajobsDataURL: openopps.usajobsDataURL,
  alert: null,
  jsHash: md5File.sync(path.join(__dirname, '../dist', 'js', 'bundle.min.js')),
  cssHash: md5File.sync(path.join(__dirname, '../dist', 'styles', 'main.css')),
};

module.exports = (app) => {
  // for rendering .ejs views
  render(app, {
    root: path.join(__dirname, '../views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false,
  });

  // serve our static resource files
  app.use(serve(path.join(__dirname, '../dist')));

  // load main/index.ejs unless api request
  app.use(async function (ctx, next) {
    ctx.cacheControl = openopps.cache.noStore;
    // Throw 404 for undefined api routes
    if(ctx.path.match('^/api/.*')) {
      // JSON request for better-body parser are in request.fields
      ctx.request.body = ctx.request.body || ctx.request.fields;
      await next();
    } else {
      await ctx.render('main/index', data);
    }
  });
};