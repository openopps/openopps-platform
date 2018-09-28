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
  db.createTable('community', {
    community_id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    community_name: { type: 'character varying', notNull: true, defaultValue: '' },
    agency_id: { type: 'bigint', notNull: true },
    community_manager_name: { type: 'character varying', notNull: true, defaultValue: '' },
    community_manager_email: { type: 'character varying', notNull: true, defaultValue: '' },
    description: { type: 'character varying' },
    target_audience: { type: 'int', notNull: true },
    is_closed_group: { type: 'int', notNull: true },
    community_type: { type: 'int', notNull: true },
    duration: { type: 'int', notNull: true },
    microsite_url: { type: 'character varying', notNull: true, defaultValue: '' },
    support_email: { type: 'character varying', notNull: true, defaultValue: '' },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('community', callback);
};
