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
  db.createTable('task_share', {
    task_id: { type: 'bigint', notNull: true, primaryKey: true, foreignKey: {
      name: 'task_share_task_fk',
      table: 'task',
      mapping: 'id',
      rules: {
        onDelete: 'CASCADE',
      },
    }}, 
    user_id: { type: 'bigint', notNull: true, primaryKey: true, foreignKey: {
      name: 'task_share_midas_user_fk',
      table: 'midas_user',
      mapping: 'id',
      rules: {
        onDelete: 'CASCADE',
      },
    }},
    shared_by_user_id: { type: 'bigint', notNull: true, foreignKey: {
      name: 'task_share_shared_by_midas_user_id_fk',
      table: 'midas_user',
      mapping: 'id',
      rules: {
        onDelete: 'RESTRICT',
      },
    }},
    last_modified: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  }, callback );
};

exports.down = function(db, callback) {
  db.dropTable('task_share', callback);
};

exports._meta = {
  "version": 1
};
