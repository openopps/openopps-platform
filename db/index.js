const _ = require('lodash');
const cfenv = require('cfenv');
const appEnv = cfenv.getAppEnv();
const psqlConnection = appEnv.getServiceCreds('psql-openopps');
const gen = require('postgres-gen');

var config = openopps.dbConnection || {
  host: 'localhost',
  db: 'midas',
  user: 'midas',
  password: 'midas',
  port: '5432',
};

if(!_.isEmpty(psqlConnection)) {
  config.host = psqlConnection.host;
  config.db = psqlConnection.db_name;
  config.user = psqlConnection.username;
  config.password = psqlConnection.password;
  config.port = psqlConnection.port;
}

module.exports = gen(config);
