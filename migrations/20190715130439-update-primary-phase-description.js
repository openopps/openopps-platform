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
    update phase set description = 'During this phase, hiring managers review the applicants for their internship opportunity, send emails to schedule interviews and make their primary selections.' 
    where "name" = 'Primary phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
