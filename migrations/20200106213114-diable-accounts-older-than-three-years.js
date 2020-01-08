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
  var sql = `
    UPDATE midas_user
    SET disabled = true
    WHERE
      "updatedAt" < now() - interval '3' year
	    and (last_login is null or last_login < now() - interval '3' year)`;
  db.runSql(sql, callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
