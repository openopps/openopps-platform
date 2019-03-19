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

exports.up = function(db, callback) {
  db.createTable('saved_task', {
    saved_task_id: {type: 'bigserial', primaryKey: true },
    task_id: { type: 'bigint', notNull: true, primaryKey: true, foreignKey: {
      name: 'saved_task_task_fk',
      table: 'task',
      mapping: 'id',
      rules: {
        onDelete: 'CASCADE',
      },
    }}, 
    user_id: { type: 'bigint', notNull: true, primaryKey: true, foreignKey: {
      name: 'saved_task_midas_user_fk',
      table: 'midas_user',
      mapping: 'id',
      rules: {
        onDelete: 'CASCADE',
      },
    }},
    created_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    deleted_at: { type: 'timestamp with time zone' },
  }, callback );
};

exports.down = function(db, callback) {
  db.dropTable('saved_task', callback);
};

exports._meta = {
  "version": 1
};
