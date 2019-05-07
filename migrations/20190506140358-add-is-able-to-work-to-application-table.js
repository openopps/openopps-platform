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
  return db.addColumn('application', 'is_able_to_work', { type: 'boolean' });
};

exports.down = function(db) {
  return db.removeColumn('application', 'is_able_to_work');
};

exports._meta = {
  "version": 1
};