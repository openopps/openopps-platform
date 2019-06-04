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
    insert into phase ("name", "description", "sequence", "config")
    values ('Primary phase', 'The primary phase will allow your hiring managers to begin reviewing applicants.', 1, 
    '{"button_name":"Start primary phase","button_action":"startPrimaryPhase"}')`, callback);
  db.runSql(`
    insert into phase ("name", "description", "sequence", "config")
    values ('Alternate phase', 'The alternate phase will allow your hiring manager to select an alternate.', 2, '{}')`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
