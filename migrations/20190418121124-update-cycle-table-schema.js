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
    db.changeColumn('cycle', 'posting_start_date', { type: 'date' }),
    db.changeColumn('cycle', 'posting_end_date', { type: 'date' }),
    db.changeColumn('cycle', 'apply_start_date', { type: 'date' }),
    db.changeColumn('cycle', 'apply_end_date', { type: 'date' }),
    db.changeColumn('cycle', 'cycle_start_date', { type: 'date' }),
    db.changeColumn('cycle', 'cycle_end_date', { type: 'date' }),
    db.changeColumn('cycle', 'review_start_date', { type: 'date' }),
    db.changeColumn('cycle', 'review_end_date', { type: 'date' }),
  ]);
};

exports.down = function(db) {
  return Promise.all([
    db.changeColumn('cycle', 'posting_start_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'posting_end_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'apply_start_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'apply_end_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'cycle_start_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'cycle_end_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'review_start_date', { type: 'timestamp with time zone' }),
    db.changeColumn('cycle', 'review_end_date', { type: 'timestamp with time zone' }),
  ]);
};

exports._meta = {
  "version": 1
};
