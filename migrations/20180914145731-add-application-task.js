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
  db.createTable('application_task', {
    application_task_id: { type: 'bigserial', primaryKey: true, autoIncrement: true },
    application_id: { type: 'bigint', notNull: true },
    user_id: { type: 'bigint', notNull: true },
    task_id: { type: 'bigint', notNull: true },
    sort_order: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('application_opportunity', callback);
};