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
  db.createTable('announcement', {
    columns: {
      id: { type: 'int', primaryKey: true, autoIncrement: true },
      content: { type: 'character varying', notNull: true },
      userId: { type: 'integer', notNull: true },
      createdAt: { type: 'timestamp with time zone' },
      updatedAt: { type: 'timestamp with time zone' },
    },
    ifNotExists: true,
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('announcement', callback);
};

