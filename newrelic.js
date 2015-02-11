/**
 * New Relic agent configuration.
 *
 * See lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 *
 * For Midas, these configuration values were moved to local.js.
 */

var local = require('./config/settings/newrelic');

exports.config = local.newrelic;
