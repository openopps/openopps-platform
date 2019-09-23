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
  db.createTable('notification_monitor', {
    columns: {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      type: { type: 'character varying', notNull: true },
      subType: { type: 'character varying' },
      data: { type: 'json', notNull: true },
      userId: { type: 'integer', notNull: true },
      createdAt: { type: 'timestamp with time zone' },
    },
    ifNotExists: true,
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('notification_monitor', callback);
};
