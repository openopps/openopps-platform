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
  return Promise.all([
    db.addColumn('audit_log', 'source', { type: 'character varying', notNull: true, defaultValue: '' }),
    db.addColumn('audit_log', 'severity', { type: 'character varying', notNull: true, defaultValue: 'info' }),
    db.addColumn('audit_log', 'status', { type: 'character varying', notNull: true, defaultValue: '' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('audit_log', 'source'),
    db.removeColumn('audit_log', 'severity'),
    db.removeColumn('audit_log', 'status'),
  ]);
};
