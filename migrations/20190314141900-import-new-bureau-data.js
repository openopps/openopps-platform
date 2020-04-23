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

exports.up = function(db, callback) {
  // delete all bureau and office data
  const pgp = require('pg-promise')();
  const connection = process.env.DATABASE_URL || require('../database.json').dev;
  const pgdb = pgp(connection);
  pgdb.none('UPDATE task SET bureau_id = null, office_id = null').then(() => {
    pgdb.none('DELETE FROM office').then(() => {
      pgdb.none('DELETE FROM bureau').then(() => {
        pgdb.none('ALTER SEQUENCE bureau_bureau_id_seq RESTART').then(() => {
          pgdb.none('ALTER SEQUENCE office_office_id_seq RESTART').then(() => {
            require('../utils/bureau-data').import(callback);
          }).catch(callback);
        }).catch(callback);
      }).catch(callback);
    }).catch(callback);
  }).catch(callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
