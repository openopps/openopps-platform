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

function updateRecord (record, newValues) {
  db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, record.id]).catch(err => {
    console.log('Error updating record for id ' + record.id, err);
  });
}

function insertRecord (newRecord) {
  db.none(queries.insertRecord, [newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for code' + newRecord.code, err);
  });
}

module.exports = (() => {
  request(process.env.DATA_IMPORT_URL + 'languagecodes', (error, response, body) => {
    console.log('Importing data for language codes');
    if(error || !response || response.statusCode != 200) {
      console.log('Error importing data for language codes' +  error, (response || {}).statusCode);
    } else {
      var values = JSON.parse(body).CodeList[0].ValidValue;
      values.forEach(value => {
        value.IsDisabled = (value.IsDisabled == 'Yes'); // change from string to boolean
        db.oneOrNone(queries.findRecord,[value.Code]).then(async (record) => {
          if(record) {
            updateRecord(record, value);
          } else {
            insertRecord(value);
          }
        }).catch(() => {
          console.log('Found multiple records for code ' + value.Code);
        });
      });
      console.log('Got ' + values.length + ' values for language');
    }
  });
})();
