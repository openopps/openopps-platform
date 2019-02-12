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
  return db.changeColumn('education', 'country_subdivision_id', { type: 'integer' });
};

exports.down = function (db) {
  // have to add a default value now to set back to not null in case there null data values
  return db.changeColumn('education', 'country_subdivision_id', { type: 'integer', notNull: true, default: 0 });
};

exports._meta = {
  'version': 1,
};
