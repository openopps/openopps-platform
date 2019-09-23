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

exports.up = function (db, callback) {
  db.createTable('cycle', {
    cycle_id: { type: 'bigserial', primaryKey: true },
    name: { type: 'character varying', notNull: true },
    posting_start_date: { type: 'timestamp with time zone' },
    posting_end_date: { type: 'timestamp with time zone' },
    apply_start_date: { type: 'timestamp with time zone' },
    apply_end_date: { type: 'timestamp with time zone' },
    cycle_start_date: { type: 'timestamp with time zone' },
    cycle_end_date: { type: 'timestamp with time zone' },
    community_id: { type: 'bigint', notNull: true },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
    updated_by: { type: 'bigint', notNull: true },
  }, (err) => {
    if (err) {
      callback(err);
    } else {
      Promise.all([
        db.addForeignKey('cycle', 'community', 'cycle_community_id_fkey', {
          'community_id': 'community_id',
        }, { onDelete: 'RESTRICT' }),
        db.addForeignKey('cycle', 'midas_user', 'cycle_updated_by_fkey', {
          'updated_by': 'id',
        }, { onDelete: 'RESTRICT' }),
      ]).then(() => { 
        callback();
      }).catch((err) => {
        callback(err);
      });
    }
  });
};

exports.down = function (db, callback) {
  db.dropTable('cycle', callback);
};
