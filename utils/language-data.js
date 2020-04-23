const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM language WHERE code = $1',
  updateRecord: 'UPDATE language ' +
      'SET value = $1, is_disabled = $2, last_modified = $3 ' +
      'WHERE language_id = $4',
  insertRecord: 'INSERT INTO language ' +
      '(code, value, is_disabled, last_modified) ' +
      'VALUES ($1, $2, $3, $4)',
};

async function updateRecord (record, newValues) {
  await db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, record.id]).catch(err => {
    console.log('Error updating record for id ' + record.id, err);
  });
}

async function insertRecord (newRecord) {
  await db.none(queries.insertRecord, [newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for code' + newRecord.code, err);
  });
}

async function findRecord (languageCode) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findRecord, [languageCode.Code]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for code ' + languageCode.Code);
      resolve();
    });
  });
}

/**
 * @param {Array} countries
 * @param {function} callback
 */
async function processLanguageCodes (languageCodes, callback) {
  var languageCode = languageCodes.pop();
  languageCode.Code = languageCode.Code.trim(); // trim coode value
  languageCode.IsDisabled = (languageCode.IsDisabled == 'Yes'); // change from string to boolean
  var record = await findRecord(languageCode); //, async (record, err) => {
  if (record) {
    await updateRecord(record, languageCode);
  } else {
    await insertRecord(languageCode);
  }
  if (languageCodes.length > 0) {
    processLanguageCodes(languageCodes, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {function=} callback
   */
  import: function (callback) {
    request(process.env.DATA_IMPORT_URL + 'languagecodes', (error, response, body) => {
      console.log('Importing data for language codes');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for language codes' +  error, (response || {}).statusCode);
      } else {
        var languageCodes = JSON.parse(body).CodeList[0].ValidValue;
        var numberOfLanguageCodes = languageCodes.length;
        processLanguageCodes(languageCodes, () => {
          console.log('Completed import of ' + numberOfLanguageCodes + ' records for language codes.');
          pgp.end();
          callback && callback();
        });
      }
    });
  },
};
