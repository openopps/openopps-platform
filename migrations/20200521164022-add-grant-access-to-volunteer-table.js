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
    db.addColumn('volunteer', 'grant_access', { type: 'character varying'}),
    db.addColumn('volunteer', 'iv', { type: 'character varying' }),
    db.addColumn('volunteer', 'nonce', { type: 'bigint' }),
  ]);
   
};


exports.down = function (db) {
  return Promise.all([
    db.removeColumn('volunteer', 'grant_access'),
    db.addColumn('volunteer', 'iv'),
    db.removeColumn('volunteer', 'nonce'),
  ]);
   
};


