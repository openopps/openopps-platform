/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var buildDictionary = require('sails-build-dictionary');

module.exports.bootstrap = function(cb) {

  // If upload directory is missing, create it
  // var config = sails.config.fileStore || {},
  //     dir = config.local.dirname || '/assets/uploads',
  //     path = p.join(sails.config.appPath, dir);
  // if (!fs.existsSync(path)) fs.mkdirSync(path);

  sails.services.passport.loadStrategies();

  // loads services in nested folders
  // for example: autocomplete sources
  buildDictionary.optional({
        dirname     : sails.config.paths.services,
        filter      : /(.+)\.(js|coffee|litcoffee)$/,
        depth     : 2,
        caseSensitive : true
      }, function (err, modules) {
           sails.services = modules;
           // It's very important to trigger this callback method when you are finished
           // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
           cb();
      });
};
