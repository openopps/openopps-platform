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
    db.changeColumn('language_skill', 'application_id', { type: 'bigint' }),
    db.addColumn('language_skill', 'task_id', { type: 'bigint' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('language_skill', 'task_id'),
    db.changeColumn('language_skill', 'application_id', { type: 'bigint', notNull: true }),
  ]);
};

