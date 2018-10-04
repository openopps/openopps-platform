const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);

const queries = {
  findRecord: 'SELECT * FROM lookup_code WHERE lookup_code_type = $1 AND code = $2',
  updateRecord: 'UPDATE lookup_code ' +
    'SET value = $1, is_disabled = $2, last_modified = $3 ' +
    'WHERE lookup_code_id = $4',
  insertRecord: 'INSERT INTO lookup_code ' +
    '(lookup_code_type, code, value, is_disabled, last_modified) ' +
    'VALUES ($1, $2, $3, $4, $5)',
};

const dataTypes = {
  academicHonors: { value: 'academichonors', type: 'HONORS' },
  degreeTypeCodes: { value: 'degreetypecodes', type: 'DEGREE_LEVEL' },
  languageProficiencies: { value: 'languageproficiencies', type: 'LANGUAGE_PROFICIENCY' },
  referenceTypeCodes: { value: 'refereetypecodes', type: 'REFERENCE_TYPE' },
  securityClearanceCodes: { value: 'securityclearances', type: 'SECURITY_CLEARANCE' },
};

function updateRecord (record, newValues) {
  db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, record.id]).catch(err => {
    console.log('Error updating record for ' + type + ' id ' + record.id, err);
  });
}

function insertRecord (type, newRecord) {
  db.none(queries.insertRecord, [type, newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for ' + type + ' code ' + newRecord.code, err);
  });
}

module.exports = {
  import: (dataType) => {
    if (dataType == 'all') {
      Object.keys(dataTypes).forEach(function (key) {
        this.import(dataTypes[key]);
      }.bind(module.exports));
    } else {
      request(process.env.DATA_IMPORT_URL + dataType.value, (error, response, body) => {
        console.log('Importing data for ' + dataType.value);
        if(error || !response || response.statusCode != 200) {
          console.log('Error importing data for ' + dataType.value, error, (response || {}).statusCode);
        } else {
          var values = JSON.parse(body).CodeList[0].ValidValue;
          values.forEach(value => {
            value.IsDisabled = (value.IsDisabled == 'Yes'); // change from string to boolean
            db.oneOrNone(queries.findRecord, [dataType.type, value.Code]).then(async (record) => {
              if(record) {
                updateRecord(record, value);
              } else {
                insertRecord(dataType.type, value);
              }
            }).catch(() => {
              console.log('Found multiple records for ' + dataType.value + ' code ' + value.Code);
            });
          });
          console.log('Got ' + values.length + ' values for ' + dataType.value);
        }
      });
    }
  },
};