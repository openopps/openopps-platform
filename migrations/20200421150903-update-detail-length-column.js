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
    db.runSql(`update task set detail_length = 'Up to 120 days' where detail_length = 'Up to 90 days'`),
    db.runSql(`update task set detail_length = 'More than 120 days' where detail_length = 'More than 90 days'`),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.runSql(`update task set detail_length = 'Up to 90 days' where detail_length = 'Up to 120 days'`),
    db.runSql(`update task set detail_length = 'More than 90 days' where detail_length = 'More than 120 days'`),
  ]);
};

exports._meta = {
  'version': 1,
};