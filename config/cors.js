/**
 * CORS middleware
 *
 * @param {Object} [options]
 *  - {String|Function(ctx)} origin `Access-Control-Allow-Origin`, default is request Origin header
 *  - {String|Array} allowMethods `Access-Control-Allow-Methods`, default is 'GET,HEAD,PUT,POST,DELETE,PATCH'
 *  - {String|Array} exposeHeaders `Access-Control-Expose-Headers`
 *  - {String|Array} allowHeaders `Access-Control-Allow-Headers`
 *  - {String|Number} maxAge `Access-Control-Max-Age` in seconds
 *  - {Boolean} credentials `Access-Control-Allow-Credentials`
 *  - {Boolean} keepHeadersOnError Add set headers to `err.header` if an error is thrown
 * @return {Function} cors middleware
 * @api public
 */

if (process.env.NODE_ENV === 'development' || typeof process.env.NODE_ENV == 'undefined')
{
  module.exports.cors = {
    origin: "*"
  };
} else {
  module.exports.cors = {
    origin: function(context) {
      if (context.header.origin.endsWith('usajobs.gov'))
      {
        return context.header.origin;
      }
      return false;
    }
  };
}
