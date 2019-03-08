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
  db.createTable('error_log', {
    error_log_id: {type: 'bigserial', primaryKey: true },
    user_id: { type: 'bigint' },
    error_data: { type: 'jsonb' },
    date_inserted: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('error_log', callback);
};

exports._meta = {
  'version': 1,
};