const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM country WHERE code = $1',
  updateRecord: 'UPDATE country ' +
      'SET value = $1, is_disabled = $2, last_modified = $3 ' +
      'WHERE country_id = $4',
  insertRecord: 'INSERT INTO country ' +
      '(code, value, is_disabled, last_modified) ' +
      'VALUES ($1, $2, $3, $4)',
};

async function updateRecord (record, newValues) {
  await db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, record.country_id]).catch(err => {
    console.log('Error updating record for id ' + record.country_id, err);
  });
}

async function insertRecord (newRecord) {
  await db.none(queries.insertRecord, [newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for code' + newRecord.code, err);
  });
}

async function findRecord (country) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findRecord, [country.Code]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for code ' + country.Code);
      resolve();
    });
  });
}

/**
 * @param {Array} countries
 * @param {function} callback
 */
async function processCountries (countries, callback) {
  var country = countries.pop();
  country.IsDisabled = (country.IsDisabled == 'Yes'); // change from string to boolean
  var record = await findRecord(country); //, async (record, err) => {
  if (record) {
    await updateRecord(record, country);
  } else {
    await insertRecord(country);
  }
  if (countries.length > 0) {
    processCountries(countries, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {function=} callback
   */
  import: function (callback) {
    request(process.env.DATA_IMPORT_URL + 'countries', (error, response, body) => {
      console.log('Importing data for countries');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for countries' +  error, (response || {}).statusCode);
      } else {
        var countries = JSON.parse(body).CodeList[0].ValidValue;
        var numberOfCountries = countries.length;
        processCountries(countries, () => {
          console.log('Completed import of ' + numberOfCountries + ' records for countries.');
          pgp.end();
          callback && callback();
        });
      }
    });
  },
};
