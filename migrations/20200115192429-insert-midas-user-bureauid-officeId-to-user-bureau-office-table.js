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
  db.runSql(`insert into user_bureau_office(user_id,bureau_id,office_id,created_at,updated_at)
  select midas_user.id as user_id, midas_user.bureau_id as bureau_id ,midas_user.office_id as office_id,now() as created_at, now() as updated_at
  from midas_user where midas_user.bureau_id is not null`, callback);
};

exports.down = function (db) {
  return null;
};


