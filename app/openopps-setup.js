const cfenv = require('cfenv');
const _ = require('lodash');

// import vars from Cloud Foundry service
var envVars = cfenv.getAppEnv().getServiceCreds('env-openopps');
if (envVars) _.extend(process.env, envVars);

var configuration = {
  appPath: './',
};
_.extend(configuration, require('../config/application'));
_.extend(configuration, require('../config/session'));
_.extend(configuration, require('../config/settings/auth'));
_.extend(configuration, require('../config/cache'));
_.extend(configuration, require('../config/version'));
_.extend(configuration, require('../config/fileStore'));
_.extend(configuration, require('../config/email'));

module.exports = configuration;