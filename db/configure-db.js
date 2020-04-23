const cfenv = require('cfenv');
const psqlConnection = cfenv.getAppEnv().getServiceCreds('psql-openopps') || {};
  
module.exports.dbConfig = {
  host: psqlConnection.host || 'localhost',
  database: psqlConnection.db_name || 'midas',
  user: psqlConnection.username || 'midas',
  password: psqlConnection.password || 'midas',
  port: psqlConnection.port || '5432',
};