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
  return db.addColumn('community', 'application_process', {
    type: 'character varying',
    notNull: true,
    defaultValue: '',
  });
};

exports.down = function (db) {
  return db.removeColumn('community', 'application_process');
};

exports._meta = {
  'version': 1,
};
