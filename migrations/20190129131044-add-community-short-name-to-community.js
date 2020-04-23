'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.addColumn('community', 'community_short_name', { type: 'character varying' }, (err) => {
    if (err) {
     callback(err);
    } else {
     db.runSql('update community set community_short_name = \'Student Internship Program (Unpaid)\' where community_name = \'U.S Department of State Student Internship Program (Unpaid)\' ', callback)
  }})
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
