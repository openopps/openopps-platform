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
    db.runSql(`update community set reference_id = 'dos' where community_name = 'U.S. Department of State Student Internship Program (Unpaid)'`),
    db.runSql(`update community set reference_id = 'vsfs' where community_name = 'Virtual Student Federal Service (VSFS)'`),
  ]);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
