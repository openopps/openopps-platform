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
  return db.addColumn('task', 'random_factor', { type: 'numeric(30,29)', notNull: true, defaultValue: new String(`cast(concat(floor(random() * 10),'.',substr(cast(random() as text),3,14), substr(cast(random() as text),3,14)) as numeric(30,29))`) });
};

exports.down = function(db) {
  return db.removeColumn('task', 'random_factor');
};

exports._meta = {
  "version": 1
};