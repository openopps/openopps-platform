const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Cycle: dao({ db: db, table: 'cycle' }),
  };
};
