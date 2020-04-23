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

async function updateRecord (record, newValues) {
  await db.none(queries.updateRecord, [newValues.Value, newValues.IsDisabled, newValues.LastModified, record.lookup_code_id]).catch(err => {
    console.log('Error updating record for ' + type + ' lookup_code_id ' + record.lookup_code_id, err);
  });
}

async function insertRecord (type, newRecord) {
  await db.none(queries.insertRecord, [type, newRecord.Code, newRecord.Value, newRecord.IsDisabled, newRecord.LastModified]).catch(err => {
    console.log('Error creating record for ' + type + ' code ' + newRecord.Code, err);
  });
}

async function findRecord (dataType, value) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findRecord, [dataType.type, value.Code]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for code ' + value.Code);
      resolve();
    });
  });
}

/**
 * @param {Object} dataType
 * @param {Array} values
 * @param {function} callback
 */
async function processValues (dataType, values, callback) {
  var value = values.pop();
  value.Code = value.Code.trim(); // trim coode value
  value.IsDisabled = (value.IsDisabled == 'Yes'); // change from string to boolean
  var record =  await findRecord(dataType, value);
  if(record) {
    await updateRecord(record, value);
  } else {
    await insertRecord(dataType.type, value);
  }
  if (values.length > 0) {
    processValues(dataType, values, callback);
  } else {
    callback();
  }
}

/**
 * @param {Array<string>} keys
 * @param {function=} callback
 */
function processDataTypes (keys, callback) {
  var key = keys.pop();
  var dataType = dataTypes[key];
  module.exports.import(dataType, () => {
    if (keys.length > 0) {
      processDataTypes(keys, callback);
    } else {
      pgp.end();
      callback && callback();
    }
  });
}

module.exports = {
  /**
   * @param {string} dataType
   * @param {function=} callback
   */
  import: function (dataType, callback) {
    if (dataType == 'all') {
      processDataTypes(Object.keys(dataTypes), callback);
    } else {
      if(_.isString(dataType)) {
        dataType = dataTypes[dataType];
      }
      request(process.env.DATA_IMPORT_URL + dataType.value, (error, response, body) => {
        console.log('Importing data for ' + dataType.value);
        if(error || !response || response.statusCode != 200) {
          console.log('Error importing data for ' + dataType.value, error, (response || {}).statusCode);
        } else {
          var values = JSON.parse(body).CodeList[0].ValidValue;
          var numberOfValues = values.length;
          processValues(dataType, values, () => {
            console.log('Completed import of ' + numberOfValues + ' records for ' + dataType.value + '.');
            callback && callback();
          });
        }
      });
    }
  },
};

if(process.argv[2] == 'import') {
  module.exports.import(process.argv[3]);
}