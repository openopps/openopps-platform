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

exports.up = function (db) {
  return db.createTable('co_owner', {
    co_owner_id: { type: 'bigint', primaryKey: true, autoIncrement: true },
    task_id: { type: 'int', notNull: true, foreignKey: {
      name: 'co_owner_task_id_fk',
      table: 'task',
      rules: {
        onDelete: 'CASCADE',
      },
      mapping: 'id',
    } },
    user_id: { type: 'int', notNull: true, foreignKey: {
      name: 'co_owner_user_id_fk',
      table: 'midas_user',
      rules: {
        onDelete: 'CASCADE',
      },
      mapping: 'id',
    } },
    created_by: { type: 'int', notNull: true },
    created_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  });
};

exports.down = function (db) {
  return db.dropTable('co_owner');
};

exports._meta = {
  'version': 1,
};
