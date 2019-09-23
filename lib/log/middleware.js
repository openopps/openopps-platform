const log = require('log')('app:http');

function bytesToSize(bytes) {
  var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes == 0) return '';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

module.exports = ( app ) => {
  // log request to console
  app.use(async (ctx, next) => {
    var start = Date.now();
    var str = ctx.method + ' ' + ctx.protocol + '://' + ctx.host + ctx.path + (ctx.querystring ? '?' + ctx.querystring : '') + ' from ' + ctx.ip;
    try {
      await next();
      str += ' -- took ' + (Date.now() - start) + 'ms -- ' + ctx.status + ' ' + bytesToSize(ctx.length || 0);
      log.info(str);
    } catch (e) {
      str += ' -- took ' + (Date.now() - start) + 'ms';
      str += ' and failed -- ' + ctx.status + ': ';
      if (e.stack) {
        str += e.message + '\n';
        str += e.stack;
      } else {
        str += e;
      }
      log.error(str);
    }
  });
}



