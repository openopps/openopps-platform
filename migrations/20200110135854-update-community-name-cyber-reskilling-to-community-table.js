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
  return db.runSql('UPDATE community SET community_name= \'Cyber Reskilling Detail Program\' where community_name = \'Cyber Reskilling Academy Graduates\'');
};

exports.down = function (db) {
  return db.runSql('UPDATE community SET community_name= \'Cyber Reskilling Academy Graduates\' where community_name = \'Cyber Reskilling Detail Program\'');
};

