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
  db.all('SELECT community_id FROM community WHERE community_name = \'U.S. Department of State Student Internship Program (Unpaid)\'', (err, results) => {
    if (results && results[0]) {
      db.runSql('INSERT INTO community_email_template ' +
      '(community_id, "action", "template", layout, created_at) ' +
      "VALUES(" + results[0].community_id + ", 'task.update.opened', 'state.department/internship.update.approved', 'state.department/layout.html', now());", callback);
    } else {
      callback(err);
    }
  });
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
