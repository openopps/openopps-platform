const cfenv = require('cfenv');
const _ = require('lodash');

// import vars from Cloud Foundry service
var appEnv = cfenv.getAppEnv();
var envVars = appEnv.getServiceCreds('env-openopps');
if (envVars) _.extend(process.env, envVars);

// If settings present, start New Relic
if (process.env.NEW_RELIC_APP_NAME && process.env.NEW_RELIC_LICENSE_KEY) {
  console.log('Activating New Relic: ', process.env.NEW_RELIC_APP_NAME);
  require('newrelic');
}

var psqlConnection = appEnv.getServiceCreds('psql-openopps');
if(psqlConnection) process.env.DB_CONNECTION = psqlConnection;

// get elastic url if it exists from Cloud Foundry service
var url = appEnv.getServiceURL('elastic56-openopps');
if (url) process.env.ELASTIC_URL = url;

var configuration = {
  appPath: './',
};
_.extend(configuration, require('../config/application'));
_.extend(configuration, require('../config/session'));
_.extend(configuration, require('../config/settings/auth'));
_.extend(configuration, require('../config/cache'));
_.extend(configuration, require('../config/cors'));
_.extend(configuration, require('../config/version'));
_.extend(configuration, require('../config/fileStore'));
_.extend(configuration, require('../config/email'));
_.extend(configuration, require('../elastic/configure-elastic'));
_.extend(configuration, require('../db/configure-db'));

module.exports = configuration;