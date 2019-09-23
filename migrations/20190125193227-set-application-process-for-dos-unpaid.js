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
  return db.runSql('UPDATE community SET application_process = \'dos\' where community_name=\'U.S Department of State Student Internship Program (Unpaid)\''); 
};

exports.down = function (db) {
  return db.runSql('UPDATE community SET application_process = \'\' where community_name=\'U.S Department of State Student Internship Program (Unpaid)\'');
};

exports._meta = {
  'version': 1,
};
