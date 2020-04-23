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
    db.addColumn('task', 'cycle_id', { type: 'integer' }),
    db.removeColumn('task', 'cycle_semester'),
    db.removeColumn('task', 'cycle_year'),  
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('task', 'cycle_id'),
    db.addColumn('task', 'cycle_semester', { type: 'character varying' }),
    db.addColumn('task', 'cycle_year', { type: 'integer' }),
  ]);
};

exports._meta = {
  'version': 1,
};
