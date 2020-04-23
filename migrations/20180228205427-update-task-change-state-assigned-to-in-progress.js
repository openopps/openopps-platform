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
  var query = 'update task ' +
    'set state = \'in progress\' ' +
    'where state = \'assigned\'';
  return db.runSql(query);
};

exports.down = function (db) {
  var query = 'update task ' +
    'set state = \'assigned\' ' +
    'where state = \'in progress\'';
  return db.runSql(query);
};
