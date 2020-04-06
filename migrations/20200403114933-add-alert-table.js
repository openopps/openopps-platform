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
  return db.createTable('alert', {
    alert_id: { type: 'int', primaryKey: true, autoIncrement: true },
    title: { type: 'character varying', notNull: true },
    description: { type: 'character varying', notNull: true },
    start_date: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    end_date: { type: 'timestamp with time zone', notNull: true },
    community_id: { type: 'bigint' },
    updated_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  });
};

exports.down = function (db) {
  return db.dropTable('alert');
};

exports._meta = {
  'version': 1,
};
