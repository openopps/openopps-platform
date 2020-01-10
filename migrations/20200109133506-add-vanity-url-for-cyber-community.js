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
  return Promise.all([
    db.runSql(`update community set vanity_url = 'cyber' where community_name = 'Cyber Reskilling Academy Graduates'`),
  ]);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
