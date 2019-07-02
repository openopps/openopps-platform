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
    insert into phase ("name", "description", "sequence", "config")
    values ('Close phase', 'The close cycle phase will end the applicant review process and hiring managers will no longer be able to move or select interns. We''ll send emails to the students who''ve been selected as primaries and alternates to explain next steps, and to students who were not selected for an internship.<br /> We''ll also move all review boards from the <b>Active</b> list to the <b>Archived</b> list. You can still access the archived review boards for historical purposes.', 3, 
    '{"modal_text": "", "button_name": "Close cycle", "alert_header": "", "modal_header": "", "confirm_action": ""}')`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
