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
    update phase set config = '{"modal_text": "Are you sure you want to start the alternate phase? Once you start the alternate phase you can''t end it without closing the entire cycle.", "button_name": "Start alternate phase", "modal_header": "Confirm start alternate phase.", "confirm_action": "startAlternatePhase", "alert_header": "You have successfully started the alternate phase." }' where "name" = 'Alternate phase'`, callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
