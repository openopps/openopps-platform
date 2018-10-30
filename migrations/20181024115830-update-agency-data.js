'use strict';

var dbm;
var type;
var seed;

/** Need to merge the following agencies
  * GSA -> General Services Administration (GSA)
  * Administration on Aging (AOA) -> HHS Administration for Community Living (ACL)
  * National Library of Medicine (HHS/NIH) -> HHS National Institutes of Health (NIH)
  * National Cancer Institute (HHS/NIH) -> HHS National Institutes of Health (NIH)
  * DOE Energy Information Administration (EIA) -> Department of Energy (DOE)
  * National Renewable Energy Laboratory (NREL) -> Department of Energy (DOE)
  */
var agencyList = [
  { old: 'GSA', new: 'General Services Administration (GSA)' },
  { old: 'Administration on Aging (AOA)', new: 'HHS Administration for Community Living (ACL)' },
  { old: 'National Library of Medicine (HHS/NIH)', new: 'HHS National Institutes of Health (NIH)' },
  { old: 'National Cancer Institute (HHS/NIH)', new: 'HHS National Institutes of Health (NIH)' },
  { old: 'DOE Energy Information Administration (EIA)', new: 'Department of Energy (DOE)' },
  { old: 'National Renewable Energy Laboratory (NREL)', new: 'Department of Energy (DOE)' },
];

var updateUserAgencyTag = 'UPDATE tagentity_users__user_tags ' +
  'SET tagentity_users = ( ' +
    'SELECT id ' +
    'FROM tagentity ' +
    'WHERE type = \'agency\' AND name = ?) ' +
  'WHERE ' +
    'tagentity_users = ( ' +
      'SELECT id ' +
      'FROM tagentity ' +
      'WHERE type = \'agency\' AND name = ?)';

var updateAgency = 'UPDATE agency ' +
  'SET name = ?, code = ?, parent_code = ? ' + 
  'WHERE old_name = ?';

/**
 * @param {Array} agencies 
 * @param {Function} callback 
 */
function migrateAgencies (agencies, db, callback) {
  var agency = agencies.pop();
  console.log('Migrating user from ' + agency.old + ' to ' + agency.new + '.');
  db.runSql(updateUserAgencyTag, [agency.new, agency.old], (err) => {
    if (err) {
      callback(err);
    } else if (agencies.length > 0) {
      migrateAgencies(agencies, db, callback);
    } else {
      callback();
    }
  });
}

/**
 * @param {Array} agencies 
 * @param {Function} callback 
 */
function updateAgencies (agencies, db, callback) {
  var agency = agencies.pop();
  console.log('Updating agency name from ' + agency.old_name + ' to ' + agency.name + '.');
  db.runSql(updateAgency, [agency.name, agency.code, agency.parent_code, agency.old_name], (err) => {
    if (err) {
      callback(err);
    } else if (agencies.length > 0) {
      updateAgencies(agencies, db, callback);
    } else {
      callback();
    }
  });
}

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
  db.addColumn('agency', 'old_name', { type: 'character varying' }, () => {
    db.runSql('UPDATE agency SET old_name = name', (err) => {
      if(err) {
        callback(err);
      } else {
        migrateAgencies(agencyList, db, (err) => {
          if (err) {
            callback(err);
          } else {
            var updateList = require('./scripts/agencyDataUpdates.json');
            updateAgencies(updateList, db, (err) => {
              callback(err);
            });
          }
        });
      }
    });
  });
};

exports.down = function (db) {
  return db.removeColumn('agency', 'old_name');
};
