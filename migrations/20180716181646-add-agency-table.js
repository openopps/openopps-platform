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
  db.createTable('agency', {
    id: { type: 'integer', primaryKey: true, autoIncrement: true },
    parent: { type: 'integer' },
    name: { type: 'character varying', notNull: true, defaultValue: '' },
    abbr: { type: 'character varying', notNull: true, defaultValue: '' },
    domain: { type: 'character varying', notNull: true, defaultValue: '' },
    slug: { type: 'character varying', notNull: true, defaultValue: '' },
    allowRestrictAgency: { type: 'boolean', notNull: true, defaultValue: true },
    allowInternships: { type: 'boolean', notNull: true, defaultValue: false },
    createdAt: { type: 'timestamp with time zone' },
    updatedAt: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('agency', callback);
};