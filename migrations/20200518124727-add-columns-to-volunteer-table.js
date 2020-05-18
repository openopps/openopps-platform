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
    db.addColumn('volunteer', 'statement_of_interest', { type: 'character varying'}),
    db.addColumn('volunteer', 'resume_id', { type: 'bigint' }),
  ]);
   
};


exports.down = function (db) {
  return Promise.all([
    db.removeColumn('volunteer', 'statement_of_interest'),
    db.removeColumn('volunteer', 'resume_id'),
  ]);
   
};


