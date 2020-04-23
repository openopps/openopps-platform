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
  db.runSql("create type valid_actions as enum('insert', 'update', 'delete');", (err) => {
    if (err) {
      callback(err);
    } else {
      db.createTable('task_share_history', {
        task_share_history_id: { type: 'bigserial', primaryKey: true },
        task_id: { type: 'bigint', notNull: true },
        user_id: { type: 'bigint', notNull: true },
        action: { type: 'valid_actions', notNull: true },        
        action_by: { type: 'bigint', notNull: true},
        action_date: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
        details: { type: 'jsonb', notNull: true },
      }, callback );
    }
  });
}

exports.down = function (db, callback) {
  db.dropTable('task_share_history', () => {
    db.runSql("drop type valid_actions;", callback);
  });
}

exports._meta = {
 'version': 1,
};