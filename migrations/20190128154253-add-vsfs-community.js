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

exports.up = function(db, callback) {
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
        'Virtual Student Federal Service',
        agency[0].id,
        'Virtual Student Program Office',
        'studentinternship@state.gov',
        'The Virtual Student Federal Service (VSFS) is the largest virtual internship in the world. Led by the U.S. Department of State, VSFS opens the doors of government to the excellence and energy of U.S. citizen students. Working from college and university campuses in the United States and throughout the world, eInterns are partnered with more than 60 federal agencies and U.S. diplomatic posts overseas.',
        2,
        true,
        2,
        2,
        'https://vsfs.state.gov',
        'studentinternship@state.gov',
        new Date(),
        new Date(),
      ], callback);
    }
  });
};

exports.down = function(db) {
  return db.runSql('DELETE FROM community WHERE community_name = ?', ['Virtual Student Federal Service']);
};
