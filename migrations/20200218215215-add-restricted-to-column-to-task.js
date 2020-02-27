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
  return db.addColumn('task', 'restricted_to', { type: 'int', foreignKey: {
    name: 'task_restricted_to_agency_id_fk',
    table: 'agency',
    mapping: 'agency_id',
    rules: {
      onDelete: 'RESTRICT',
    },
  }});
};

exports.down = function (db) {
  return db.removeColumn('task', 'restricted_to');
};

exports._meta = {
  'version': 1,
};
