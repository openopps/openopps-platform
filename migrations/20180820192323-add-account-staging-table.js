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
  db.createTable('account_staging', {
    id: { type: 'bigserial', primaryKey: true, autoIncrement: true },
    linked_id: { type: 'bigserial', notNull: true, unique: true },
    uuid: { type: 'uuid', notNull: true },
    government_uri: { type: 'character varying', notNull: true },
    username: { type: 'character varying', notNull: true, defaultValue: '' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('account_staging', callback);
};

