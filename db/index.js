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

var config = {
  host: process.env.RDS_HOSTNAME,
  db: 'ebdb',
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  port: process.env.RDS_PORT
};

console.log('process env TEST_DATABASE_URL', process.env.TEST_DATABASE_URL);
console.log('process env DATABASE_URL', process.env.DATABASE_URL);
console.log('db config', config);
module.exports = gen(config);
