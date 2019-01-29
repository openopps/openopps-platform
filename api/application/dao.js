const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Application: dao({ db: db, table: 'application' }),
    ApplicationTask: dao({ db: db, table: 'application_task' }),
    Community: dao({ db: db, table: 'community' }),
    Task: dao({ db: db, table: 'task' }),
  };
};
