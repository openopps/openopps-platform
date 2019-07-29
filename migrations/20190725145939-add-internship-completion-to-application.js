'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return Promise.all([
    db.addColumn('application', 'internship_completed', { type: 'bigint' }),
    db.addColumn('application', 'internship_completed_at', { type: 'timestamp with time zone' }),
    db.addColumn('application', 'internship_updated_by', { type: 'bigint' }),
  ]);
};

exports.down = function(db) {
  return Promise.all([
    db.removeColumn('application', 'internship_completed'),
    db.removeColumn('application', 'internship_completed_at'),
    db.removeColumn('application', 'internship_updated_by'),
  ]);
};

exports._meta = {
  "version": 1
};
