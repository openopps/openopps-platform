/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */
var extend = require('util')._extend,
    cfenv = require('cfenv'),
    appEnv = cfenv.getAppEnv(),
    userEnv = appEnv.getServiceCreds('env-openopps');

// Import vars from Cloud Foundry service
if (userEnv) extend(process.env, userEnv);

// If settings present, start New Relic
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
  console.log('Activating New Relic: ', process.env.NEW_RELIC_APP_NAME);
  require('newrelic');
}

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.
process.chdir(__dirname);

require('app-module-path').addPath('lib/');
const log = require('log')('app');

log.info('start');

(function () {
  // Ensure all our dependencies can be located:
  try {
    require('./app/openopps')();
  } catch (e) {
    log.error('Error starting app\n');
    log.error(e);
    if(e.message.match('Cannot find module')) {
      var module = e.message.split('Cannot find module ')[1];
      log.error('To fix the error please try running `npm install ' + module.replace(/'/g, '') + '`');
    }
    return;
  }
})();
