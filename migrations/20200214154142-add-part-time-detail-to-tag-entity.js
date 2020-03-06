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

exports.up = function (db) {
  var query = 'insert into tagentity ' +
    '(type, name, "createdAt", "updatedAt") ' +
    "values ('task-time-required', 'Part Time Detail', '" + (new Date()).toISOString() + "', '" + (new Date()).toISOString() + "')";
  return db.runSql(query);
};

exports.down = function (db) {
  var query = 'delete from tagentity where type=\'task-time-required\' and name=\'Part Time Detail\'';
  return db.runSql(query);
};

