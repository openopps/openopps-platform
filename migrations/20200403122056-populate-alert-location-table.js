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
  return db.runSql(`INSERT INTO alert_location (location) VALUES ('index'), ('home'), ('profile'), ('search'), ('internships'), ('people')`);
};

exports.down = function (db) {
  return db.runSql('TRUNCATE alert_location RESTART IDENTITY CASCADE');
};

exports._meta = {
  'version': 1,
};
