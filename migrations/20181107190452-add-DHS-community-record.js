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
  db.all('SELECT agency_id as id FROM agency WHERE name = \'Department of Homeland Security\'', (err, agency) => {
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
        'DHS Joint Duty Program',
        agency[0].id,
        'Kenneth Johnson',
        'JointDutyProgramOffice@hq.dhs.gov',
        'The Department of Homeland Security Joint Duty Program is an intra- and inter-departmental program that offers civilian personnel professional and developmental opportunities.  Joint duty assignments enhance operations and mission execution through unity of effort and collaboration.  The program covers Federal employees at the GS-13 through GS-15 grade levels and equivalent.',
        2,
        false,
        3,
        2,
        'JointDutyProgramOffice',
        'JointDutyProgramOffice@hq.dhs.gov',
        new Date(),
        new Date(),
      ], callback);
    }
  });
};

exports.down = function (db) {
  return db.runSql('DELETE FROM community WHERE community_name = ?', ['DHS Joint Duty Program']);
};