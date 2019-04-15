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
    db.runSql('UPDATE office SET name = \'Office of Brazil and Southern Cone (WHA/BSC)\' where name=\'Office of Brail and Southern Cone (WHA/BSC)\''),
    db.runSql('UPDATE office SET name = \'U.S. Embassy La Paz\' where name=\'U.S. Embassy LaPaz\''),

  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.runSql('UPDATE office SET name = \'Office of Brail and Southern Cone (WHA/BSC)\' where name=\'Office of Brazil and Southern Cone (WHA/BSC)\''),
    db.runSql('UPDATE office SET name = \'U.S. Embassy LaPaz\' where name=\'U.S. Embassy La Paz\''),

  ]);
};


