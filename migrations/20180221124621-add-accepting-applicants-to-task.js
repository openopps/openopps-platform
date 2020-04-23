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
  db.addColumn('task', 'accepting_applicants', {
    type: 'boolean',
    defaultValue: true,
    notNull: true,
  }, updateExistingRecords);

  function updateExistingRecords (err) {
    if (err) {
      callback(err);
      return;
    }
    var query = 'update task ' +
      'set accepting_applicants = false ' +
      "where state in ('assigned', 'completed', 'archived')";
    db.runSql(query, callback);
  }
};

exports.down = function (db, callback) {
  db.removeColumn('task', 'accepting_applicants', callback);
};
