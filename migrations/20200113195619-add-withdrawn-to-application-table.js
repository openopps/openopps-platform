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
    db.addColumn('application', 'withdrawn', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('application', 'withdrawn_at', { type: 'timestamp with time zone' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('application', 'withdrawn'),
    db.removeColumn('application', 'withdrawn_at'),
  ])
};
