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
    db.addColumn('account_staging', 'tokenset', { type: 'jsonb', defaultValue: '{}' }),
    db.removeColumn('account_staging', 'access_token'),
    db.removeColumn('account_staging', 'id_token'),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('account_staging', 'tokenset'),
    db.addColumn('account_staging', 'access_token', { type: 'character varying' }),
    db.addColumn('account_staging', 'id_token', { type: 'character varying' }),
  ]);
};

exports._meta = {
  'version': 1,
};
