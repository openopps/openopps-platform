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
    db.addColumn('task', 'country_id', { type: 'bigint' }),
    db.addColumn('task', 'country_subdivision_id', { type: 'bigint' }),
    db.addColumn('task', 'city_name', { type: 'character varying' }),
    db.addColumn('task', 'interns', { type: 'integer' }),
    db.addColumn('task', 'cycle_year', { type: 'integer' }),
    db.addColumn('task', 'cycle_semester', { type: 'character varying' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('task', 'country_id'),
    db.removeColumn('task', 'country_subdivision_id'),
    db.removeColumn('task', 'city_name'),
    db.removeColumn('task', 'interns'),
    db.removeColumn('task', 'cycle_year'),
    db.removeColumn('task', 'cycle_semester'),

  ]);
};

