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

exports.up = function (db, callback) {
  db.runSql(`
  update phase set config = '{"modal_text": "Are you sure you want to close the cycle? Hiring managers will not be able to make selections once the cycle is closed. Emails will go to all applicants to inform them of their status and we''ll archive all review boards. Once review boards are archived, they can''t be reopened.", "button_name": "Close cycle", "alert_header": "", "modal_header": "Confirm Close cycle.", "confirm_action": "closeCycle"}' where "name" = 'Close phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
