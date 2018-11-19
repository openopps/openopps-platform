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
  db.all('SELECT agency_id as id FROM agency WHERE name = \'Department of State\'', (err, agency) => {
    if(err || agency.length == 0) {
      callback(err);
    } else {
      db.insert('community', [
        'community_name',
        'agency_id',
        'community_manager_name',
        'community_manager_email',
        'description',
        'target_audience',
        'is_closed_group',
        'community_type',
        'duration',
        'microsite_url',
        'support_email',
        'created_at',
        'updated_at',
      ], [
        'Student Internship Program (unpaid)',
        agency[0].id,
        'Student Internship Program Office',
        'studentinternship@state.gov',
        'The U.S. Department of State Student Internship Program is an unpaid internship with the opportunity to work in U.S. embassies and consulates throughout the world, as well as in various bureaus located in Washington, D.C. and at Department offices around the United States. This program is designed to provide substantive learning experiences in a foreign affairs environment.',
        2,
        true,
        3,
        2,
        'https://careers.state.gov/intern/student-internships/',
        'studentinternship@state.gov',
        new Date(),
        new Date(),
      ], callback);
    }
  });
};

exports.down = function (db) {
  return db.runSql('DELETE FROM community WHERE community_name = ?', ['Student Internship Program (unpaid)']);
};