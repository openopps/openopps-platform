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
    update phase set config = '{"alert_header":"You have successfully started the primary phase.","button_name":"Start primary phase","confirm_action":"startPrimaryPhase","modal_header":"Confirm start primary phase.","modal_text":"Are you sure you want to start <strong>primary phase</strong>? Hiring managers will be able to view and interact with students on their boards. This action cannot be undone."}' where "name" = 'Primary phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
