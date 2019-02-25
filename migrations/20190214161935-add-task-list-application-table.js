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
	db.createTable('task_list_application', {
    task_list_application_id: { type: 'bigint', primaryKey: true, autoIncrement: true }, 
    task_list_id: { type: 'bigint', notNull: true, foreignKey: {
        name: 'task_list_application_task_list_fk',
        table: 'task_list',
        mapping: 'task_list_id',
        rules: {
          onDelete: 'CASCADE'
        }
      } 
    },
    application_id: { type: 'bigint', notNull: true, foreignKey: {
        name: 'task_list_application_application_fk',
        table: 'application',
        mapping: 'application_id',
        rules: {
          onDelete: 'CASCADE'
        }
      }, 
    },
    sort_order: { type: 'int', notNull: true, defaultValue: 0 },
    date_last_viewed: { type: 'timestamp with time zone', notNull: false },
    date_last_contacted: { type: 'timestamp with time zone', notNull: false },
    created_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
    updated_by: { type: 'int', notNull: true, foreignKey: {
        name: 'task_list_application_midas_user_fk',
        table: 'midas_user',
        mapping: 'id',
        rules: {
          onDelete: 'RESTRICT'
        }
      } 
    },
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('task_list_application', callback);
};

exports._meta = {
  "version": 1
};
