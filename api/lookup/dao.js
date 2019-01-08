const _ = require('lodash');
var dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Lookup: dao({ db:db, table:'lookup_code' }),
  };
};
