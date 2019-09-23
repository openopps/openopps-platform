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
  db.addColumn('midas_user', 'government_uri', {
    type: 'character varying',
    defaultValue: '',
    notNull: true,
  }, callback);
};

exports.down = function (db, callback) {
  db.removeColumn('midas_user', 'government_uri', callback);
};