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
  return db.runSql('UPDATE community SET community_logo = \'/img/community-logo/png/dhs.png\' where community_name=\'DHS Joint Duty Program\'');
};

exports.down = function (db) {
  return db.runSql('UPDATE community SET community_logo = \'\' where community_name=\'DHS Joint Duty Program\'');
};


