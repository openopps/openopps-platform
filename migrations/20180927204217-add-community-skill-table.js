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
  db.createTable('community_skill', {
    community_skill_id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    community_id: { type: 'bigint', notNull: true },
    title: { type: 'character varying', notNull: true, defaultValue: '' },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('community_skill', callback);
};
