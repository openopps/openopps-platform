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
  return db.runSql('ALTER TABLE co_owner ADD CONSTRAINT unique_co_owner UNIQUE (task_id, user_id)', callback);
};

exports.down = function(db, callback) {
  return db.runSql('ALTER TABLE co_owner DROP CONSTRAINT unique_co_owner', callback);
};

exports._meta = {
  "version": 1
};
