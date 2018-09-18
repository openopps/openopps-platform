require('app-module-path').addPath('lib/');
const _ = require('lodash');

const dbConnection = {
  host: 'localhost',
  db: 'midastest',
  user: 'midas',
  password: 'midas',
  port: '5432',
};

_.extend(openopps, { dbConnection: dbConnection });