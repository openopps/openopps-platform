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
    db.addColumn('midas_user', 'country_id', { type: 'bigint' }),
    db.addColumn('midas_user', 'country_subdivision_id', { type: 'bigint' }),
    db.addColumn('midas_user', 'city_name', { type: 'character varying' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('midas_user', 'country_id'),
    db.removeColumn('midas_user', 'country_subdivision_id'),
    db.removeColumn('midas_user', 'city_name'),
  ]);
};

exports._meta = {
  "version": 1
};
