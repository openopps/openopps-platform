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
  return db.runSql('UPDATE community SET is_closed_group = true, community_type = 2 where community_name = \'DHS Joint Duty Program\'');
};

exports.down = function (db) {
  return db.runSql('UPDATE community SET is_closed_group = false, community_type = 3 where community_name = \'DHS Joint Duty Program\'');
};

exports._meta = {
  'version': 1,
};
