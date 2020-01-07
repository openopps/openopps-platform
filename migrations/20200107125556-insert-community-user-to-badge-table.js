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

exports.up = function (db,callback) {
  db.runSql(`insert into badge("user","type","createdAt", "updatedAt")
select community_user.user_id as user, 'community manager' as type, now() as "createdAt", now() as "updatedAt"
from community_user
where community_user.is_manager = true`, callback);
};

exports.down = function (db) {
  return null;
};


