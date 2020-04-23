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
  db.addColumn('volunteer', 'taskComplete', {
    type: 'boolean',
    defaultValue: false,
    notNull: true,
  }, updateExistingRecords);

  function updateExistingRecords (err) {
    if (err) {
      callback(err);
      return;
    }
    var query = 'update volunteer ' +
      'set "taskComplete" = true ' +
      'where "taskId" in (' +
        'select id from task ' +
        'where "completedAt" is not null' +
      ')';
    db.runSql(query, callback);
  }
};

exports.down = function (db, callback) {
  db.removeColumn('volunteer', 'taskComplete', callback);
};
