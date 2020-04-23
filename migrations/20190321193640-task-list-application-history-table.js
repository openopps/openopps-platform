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
  db.createTable('task_list_application_history', {
    task_list_application_history_id: { type: 'bigserial', primaryKey: true },
    task_list_application_id: { type: 'bigint', notNull: true },
    action: { type: 'valid_actions', notNull: true },        
    action_by: { type: 'bigint', notNull: true},
    action_date: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    details: { type: 'jsonb', notNull: true },
  }, callback );
}

exports.down = function (db, callback) {
  db.dropTable('task_list_application_history', callback);
}

exports._meta = {
 'version': 1,
};