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

exports.up = function (db, callback) {
  db.runSql(`
    update phase set description = 'During this phase hiring managers will continue to review applicants for their internship opportunity and make their alternate selections.  If they haven’t filled all of their primary slots, they can also complete their primary selections.' where "name" = 'Alternate phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
