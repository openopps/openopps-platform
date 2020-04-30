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
  return Promise.all([
    db.runSql(`update task set people_needed = '6+' where people_needed = '5+'`),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.runSql(`update task set people_needed = '5+' where people_needed = '6+'`),
  ]);
};

exports._meta = {
  'version': 1,
};