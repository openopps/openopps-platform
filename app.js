var config = require('./config/settings/newrelic');
// If New Relic is enabled on the server, load it
if (config.newrelicEnabled === true) {
  require('newrelic');
}
// Start sails and pass it command line arguments
require('sails').lift(require('optimist').argv);
