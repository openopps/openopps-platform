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
    db.addColumn('application', 'community_id', { type: 'bigint', notNull: true }),
    db.addColumn('application', 'cycle_id', { type: 'bigint' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('application', 'community_id'),
    db.removeColumn('application', 'cycle_id'),
  ]);
};

exports._meta = {
  'version': 1,
};
