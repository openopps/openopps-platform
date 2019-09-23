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
  db.createTable('audit_log', {
    id: { type: 'bigserial', primaryKey: true, autoIncrement: true },
    action: { type: 'character varying', notNull: true },
    description: { type: 'character varying', notNull: true },
    data: { type: 'json', notNull: true },
    userId: { type: 'integer', notNull: true },
    role: { type: 'character varying', notNull: true },
    dateInserted: { type: 'timestamp with time zone', notNull: true },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('audit_log', callback);
};
