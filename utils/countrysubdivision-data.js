const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM country_subdivision WHERE code = $1 and parent_code = $2',
  updateRecord: 'UPDATE country_subdivision ' +
      'SET value = $1, is_disabled = $2, last_modified = $3, parent_code = $4 ' +
      'WHERE country_subdivision_id = $5',
  insertRecord: 'INSERT INTO country_subdivision ' +
      '(code, value, is_disabled, last_modified, parent_code) ' +
      'VALUES ($1, $2, $3, $4,$5)',
};

async function updateRecord (record, newValues) {
  await db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, newValues.ParentCode, record.country_subdivision_id ]).catch(err => {
    console.log('Error updating record for id ' + record.country_subdivision_id, err);
  });
}

async function insertRecord (newRecord) {
  await db.none(queries.insertRecord, [newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified, newRecord.ParentCode]).catch(err => {
    console.log('Error creating record for code' + newRecord.Code, err);
  });
}

async function findRecord (countrySubdivision) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findRecord, [countrySubdivision.Code, countrySubdivision.ParentCode]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for code ' + countrySubdivision.Code + ', ' + countrySubdivision.ParentCode);
      resolve();
    });
  });
}

/**
 * @param {Array} countries
 * @param {function} callback
 */
async function processCountrySubdivisions (countrySubdivisions, callback) {
  var countrySubdivision = countrySubdivisions.pop();
  countrySubdivision.IsDisabled = (countrySubdivision.IsDisabled == 'Yes'); // change from string to boolean
  var record = await findRecord(countrySubdivision); //, async (record, err) => {
  if (record) {
    await updateRecord(record, countrySubdivision);
  } else {
    await insertRecord(countrySubdivision);
  }
  if (countrySubdivisions.length > 0) {
    processCountrySubdivisions(countrySubdivisions, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {function=} callback
   */
  import: function (callback) {
    request(process.env.DATA_IMPORT_URL + 'countrysubdivisions', (error, response, body) => {
      console.log('Importing data for country subdivisions');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for country subdivisions' +  error, (response || {}).statusCode);
      } else {
        var countrySubdivisions = JSON.parse(body).CodeList[0].ValidValue;
        var numberOfCountrySubdivisions = countrySubdivisions.length;
        processCountrySubdivisions(countrySubdivisions, () => {
          console.log('Completed import of ' + numberOfCountrySubdivisions + ' records for country subdivisions.');
          pgp.end();
          callback && callback();
        });
      }
    });
  },
};