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
  update phase set description = 'During this phase hiring managers will continue to review applicants for their internship opportunity and make their alternate selections.  If they haven’t filled all of their primary slots, they can also complete their primary selections. <br /><br />It may take up to 10 minutes for the boards to repopulate for the alternate phase. Once the boards are ready, you’ll see a success banner at the top of the screen.' where "name" = 'Alternate phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};