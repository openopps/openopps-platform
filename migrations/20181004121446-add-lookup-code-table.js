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
  db.createTable('lookup_code', {
    lookup_code_id: { type: 'integer', primaryKey: true, autoIncrement: true },
    lookup_code_type: { type: 'character varying', notNull: true },
    code: { type: 'character varying', notNull: true },
    value: { type: 'character varying', notNull: true },
    is_disabled: { type: 'boolean', notNull: true, defaultValue: false },
    sort_order: { type: 'integer', notNull: true, defaultValue: 1 },
    last_modified: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('lookup_code', callback);
};