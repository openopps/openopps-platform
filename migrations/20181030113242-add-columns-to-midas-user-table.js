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
    db.addColumn('midas_user', 'given_name', { type: 'character varying' }),
    db.addColumn('midas_user', 'middle_name', { type: 'character varying' }),
    db.addColumn('midas_user', 'last_name', { type: 'character varying' }),
    db.addColumn('midas_user', 'agency_id', { type: 'integer' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('midas_user', 'given_name'),
    db.removeColumn('midas_user', 'middle_name'),
    db.removeColumn('midas_user', 'last_name'),
    db.removeColumn('midas_user', 'agency_id'),
  ]);
};

exports._meta = {
  'version': 1,
};
