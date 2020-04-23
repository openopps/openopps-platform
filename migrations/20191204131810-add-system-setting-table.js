'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.createTable('system_setting', {
    system_setting_id: { type: 'int', primaryKey: true, autoIncrement: true },
    key: { type: 'character varying', notNull: true, unique: true },
    value: { type: 'character varying', notNull: true },
    display: { type: 'character varying', notNull: true, unique: true },
    updated_at: { type: 'timestamp with time zone', notNull: true },
    user_id: { type: 'int', notNull: true },
  });
};

exports.down = function(db) {
  return db.dropTable('system_setting');
};

exports._meta = {
  "version": 1
};
