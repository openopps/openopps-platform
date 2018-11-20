const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Community: dao({ db: db, table: 'community' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
  };
};
