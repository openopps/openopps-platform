const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM agency WHERE code = $1',
  findRecordByName: 'SELECT * FROM agency WHERE lower(name) LIKE ',
  updateRecord: 'UPDATE agency ' +
      'SET code = $1, parent_code = $2, name = $3, is_disabled = $4, updated_at = $5 ' +
      'WHERE agency_id = $6',
  insertRecord: 'INSERT INTO agency ' +
      '(code, parent_code, name, is_disabled, created_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6)',
};

function updateRecord (record, newValues) {
  db.none(queries.updateRecord, [newValues.Code, newValues.ParentCode, newValues.Value, newValues.IsDisabled, newValues.LastModified, record.agency_id]).catch(err => {
    console.log('Error updating record for id ' + record.id, err);
  });
}

function insertRecord (newRecord) {
  db.none(queries.insertRecord, [newRecord.Code, newRecord.ParentCode, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for code' + newRecord.Code, err);
  });
}

function findRecord (initalRun, value, callback) {
  db.oneOrNone(queries.findRecord,[value.Code]).then(record => {
    if (!record && initalRun) {
      db.oneOrNone(queries.findRecordByName + 'lower(\'%' + value.Value.replace("'", "''") + '%\')').then(callback).catch(() => {
        callback(null, 'Found multiple records for value ' + value.Value);
      });
    } else {
      callback(record);
    }
  }).catch(() => {
    callback(null, 'Found multiple records for code ' + value.Code);
  });
}

module.exports = {
  import: (initalRun) => {
    request(process.env.DATA_IMPORT_URL + 'agencysubelements', (error, response, body) => {
      console.log('Importing data for agencies');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for agency codes' +  error, (response || {}).statusCode);
      } else {
        var values = JSON.parse(body).CodeList[0].ValidValue;
        values.forEach(value => {
          value.IsDisabled = (value.IsDisabled == 'Yes'); // change from string to boolean
          findRecord(initalRun, value, (record, err) => {
            if (err) {
              console.log(err);
            } else if (record) {
              updateRecord(record, value);
            } else {
              insertRecord(value);
            }
          });
        });
        console.log('Completed import of ' + values.length + ' records for agencies.');
      }
    });
  },
};

module.exports.import(process.argv[2].match(/^[Tt]rue$/));