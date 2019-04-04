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
    db.addColumn('cycle', 'review_start_date', { type: 'timestamp with time zone' }),
    db.addColumn('cycle', 'review_end_date', { type: 'timestamp with time zone' }),
  ]);
};

exports.down = function(db) {
  return Promise.all([ 
    db.removeColumn('cycle', 'review_start_date'),
    db.removeColumn('cycle', 'review_end_date'),
  ]);
};

exports._meta = {
  "version": 1
};
