'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  var query = 'update tagentity ' +
    'set data = \'{ "allowRestrictAgency": false }\' ' +
    'where type = \'agency\' and data is null';
  db.runSql(query, callback);
};

exports.down = function (db) {
  return null;
};