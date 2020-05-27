const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM agency WHERE code = $1',
  findRecordByName: 'SELECT * FROM agency WHERE code = \'\' and lower(name) LIKE ',
  updateRecord: 'UPDATE agency ' +
      'SET code = $1, parent_code = $2, name = $3, abbr = $4, is_disabled = $5, updated_at = $6 ' +
      'WHERE agency_id = $7',
  insertRecord: 'INSERT INTO agency ' +
      '(code, parent_code, name, abbr, is_disabled, created_at, updated_at) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7)',
};

async function updateRecord (record, newValues) {
  await db.none(queries.updateRecord, [newValues.Code, newValues.ParentCode, newValues.Value, (newValues.Acronym || ''), newValues.IsDisabled, newValues.LastModified, record.agency_id]).catch(err => {
    console.log('Error updating record for id ' + record.id, err);
  });
}

async function insertRecord (newRecord) {
  await db.none(queries.insertRecord, [newRecord.Code, newRecord.ParentCode, newRecord.Value, (newRecord.Acronym || ''), newRecord.IsDisabled, newRecord.LastModified, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for code' + newRecord.Code, err);
  });
}

function findRecord (initalRun, value) {
  return new Promise(async resolve => {
    var record = await db.oneOrNone(queries.findRecord,[value.Code]).catch(() => {
      console.log('Found multiple records for code ' + value.Code);
    });
    if (!record && initalRun) {
      var tagentityRecord = await db.oneOrNone(queries.findRecordByName + '\'%' + value.Value.replace("'", "''").toLowerCase() + '%\'').catch((err) => {
        console.log('[ERROR]: ', err);
        console.log('Found multiple records for value ' + value.Value);
      });
      resolve(tagentityRecord);
    } else {
      resolve(record);
    }
  });
}

async function processValues (initalRun, values, callback) {
  var value = values.pop();
  value.IsDisabled = (value.IsDisabled == 'Yes'); // change from string to boolean
  var record = await findRecord(initalRun, value); //, async (record, err) => {
  if (record) {
    await updateRecord(record, value);
  } else {
    await insertRecord(value);
  }
  if (values.length > 0) {
    processValues(initalRun, values, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {boolean=} initalRun default false
   * @param {function=} callback
   */
  import: (initalRun, callback) => {
    request(process.env.DATA_IMPORT_URL + 'agencysubelements', (error, response, body) => {
      console.log('Importing data for agencies');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for agency codes' +  error, (response || {}).statusCode);
      } else {
        var values = JSON.parse(body).CodeList[0].ValidValue;
        values = _.sortBy(values, 'ParentCode');
        var numberOfAgencies = values.length;
        processValues(initalRun, values, () => {
          console.log('Completed import of ' + numberOfAgencies + ' records for agencies.');
          pgp.end();
          callback && callback();
        });
      }
    });
  },
};

if(process.argv[2] == 'import') {
  module.exports.import((process.argv[3] || '').match(/^[Tt]rue$/));
}