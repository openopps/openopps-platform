const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findRecord: 'SELECT * FROM pay_plan WHERE code = $1',
  updateRecord: 'UPDATE pay_plan ' +
      'SET value = $1, is_disabled = $2, last_modified = $3 ' +
      'WHERE language_id = $4',
  insertRecord: 'INSERT INTO pay_plan ' +
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

async function findRecord (payplanCode) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findRecord, [payplanCode.Code]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for code ' + payplanCode.Code);
      resolve();
    });
  });
}

/**
 * @param {Array} countries
 * @param {function} callback
 */
async function processPayplanCodes (payplanCodes, callback) {
  var payplanCode = payplanCodes.pop();
  payplanCode.Code = payplanCode.Code.trim(); // trim coode value
  payplanCode.IsDisabled = (payplanCode.IsDisabled == 'Yes'); // change from string to boolean
  var record = await findRecord(payplanCode); //, async (record, err) => {
  if (record) {
    await updateRecord(record, payplanCode);
  } else {
    await insertRecord(payplanCode);
  }
  if (payplanCodes.length > 0) {
    processPayplanCodes(payplanCodes, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {function=} callback
   */
  import: function (callback) {
    request(process.env.DATA_IMPORT_URL + 'payplans', (error, response, body) => {
      console.log('Importing data for pay plans');
      if(error || !response || response.statusCode != 200) {
        console.log('Error importing data for pay plans' +  error, (response || {}).statusCode);
      } else {
        var payplanCodes = JSON.parse(body).CodeList[0].ValidValue;
        var numberOfPayPlanCodes = payplanCodes.length;
        processPayplanCodes(payplanCodes, () => {
          console.log('Completed import of ' + numberOfPayPlanCodes + ' records for pay plans.');
          pgp.end();
          callback && callback();
        });
      }
    });
  },
};
