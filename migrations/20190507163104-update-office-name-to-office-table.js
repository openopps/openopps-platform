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
  return db.runSql('UPDATE office SET name=\'Office of Academic Programs (ECA/A)\' where name = \'Office of Acacemic Programs (ECA/A)\''); 
};

exports.down = function (db) {
  return db.runSql('UPDATE office SET name=\'Office of Acacemic Programs (ECA/A)\' where name = \'Office of Academic Programs (ECA/A)\''); 
};


