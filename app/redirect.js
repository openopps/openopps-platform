const log = require('log')('openopps');

module.exports = (app) => {
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
};