'use strict';

var dbm;
var type;
var seed;

var selectDepartment = 'SELECT * FROM agency WHERE code = \'';
var updateDepartment = 'UPDATE agency ' +
  'SET old_name = \'\' ' + 
  'WHERE code = ?';
var updateAgency = 'UPDATE agency ' +
  'SET abbr = ?, domain = ?, slug = ?, old_name = ? ' + 
  'WHERE code = ?';

/**
 * @param {Array} departments 
 * @param {Function} callback 
 */
function updateAgencyDepartments (departments, db, callback) {
  var department = departments.pop();
  console.log('Updating department records for ', department);
  db.all(selectDepartment + department.parent_code + '\'', (err, results) => {
    if (err) {
      console.log('Error selecting department');
      callback(err);
    } else {
      console.log('Updating agency record...');
      var agency = results[0];
      db.runSql(updateAgency, [agency.abbr, agency.domain, agency.slug, agency.old_name, department.code], (err) => {
        if (err) {
          console.log('Error updating agency');
          callback(err);
        } else {
          console.log('Updating department record...');
          db.runSql(updateDepartment, [department.parent_code], (err) => {
            if (err) {
              console.log('Error updating department');
              callback(err);
            } else if (departments.length > 0) {
              updateAgencyDepartments(departments, db, callback);
            } else {
              callback();
            }
          });
        }
      });
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
  var departmentList = require('./scripts/agencyDepartmentDataFixes.json');
  updateAgencyDepartments(departmentList, db, (err) => {
    if (err) console.log('[ERROR]:', err);
    callback(err);
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
