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
  return db.addIndex('application_task', 'application_task_task_id_idx', 'task_id');
};

exports.down = function(db) {
  return db.removeIndex('application_task', 'application_task_task_id_idx');
};

exports._meta = {
  "version": 1
};
