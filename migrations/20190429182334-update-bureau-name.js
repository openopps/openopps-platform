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
    db.runSql('UPDATE bureau SET name = \'United States Mission to the UN (USUN)\' where name=\'United States Mission to the UN (USN)\''),

  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.runSql('UPDATE bureau SET name = \'United States Mission to the UN (USN)\' where name=\'United States Mission to the UN (USUN)\''),

  ]);
};