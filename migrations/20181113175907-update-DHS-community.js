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
  return db.runSql('UPDATE community SET target_audience = 1, duration = 1 where community_name = \'DHS Joint Duty Program\'');
};

exports.down = function (db) {
  return db.runSql('UPDATE community SET target_audience = 2, duration = 2 where community_name = \'DHS Joint Duty Program\'');
};

exports._meta = {
  'version': 1,
};
