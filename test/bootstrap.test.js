require('app-module-path').addPath('lib/');
const _ = require('lodash');

global.openopps = {
  appPath: __dirname,
  dbConnection: {
    host: 'localhost',
    db: 'midastest',
    user: 'midas',
    password: 'midas',
    port: '5432',
  },
};
