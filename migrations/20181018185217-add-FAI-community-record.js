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
  db.all('SELECT id FROM agency WHERE name LIKE \'General Services Administration%\'', (err, agency) => {
    if(err || agency.length == 0) {
      callback(err);
    } else {
      db.all('SELECT id FROM tagentity WHERE type = \'career\' AND name = \'Acquisition\'', (err, career) => {
        if(err || career.length == 0) {
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
            'community_type_value',
            'duration',
            'created_at',
            'updated_at',
          ], [
            'Federal Acquisition Professionals',
            agency[0].id,
            'Anne Reinhold',
            'Anne.Reinhold@fai.gov',
            '',
            1,
            false,
            1,
            career[0].id,
            1,
            new Date(),
            new Date(),
          ], callback);
        }
      });
    }
  });
};

exports.down = function (db) {
  return db.runSql('DELETE FROM community WHERE community_name = ?', ['Federal Acquisition Professionals']);
};