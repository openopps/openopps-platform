const request = require('request');
const _ = require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);


const queries = {
  findBureauRecord: 'SELECT bureau_id FROM bureau WHERE name = $1',
  findOfficeRecord: 'SELECT * FROM office WHERE name = $1',
  insertBureauRecord: 'INSERT INTO bureau ' +
      '(name) ' +
      'VALUES ($1) returning bureau_id',
  insertOfficeRecord: 'INSERT INTO office ' +
      '(bureau_id,  name) ' +
      'VALUES ($1, $2)',
  updateOfficeRecord: 'UPDATE office SET ' +
      'bureau_id = $1, name = $2 ' +
      'where office_id = $3'
};

async function insertBureauRecord (bureau) {
  return new Promise(resolve => {
    db.one(queries.insertBureauRecord, [bureau.name]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Error inserting bureau ' + bureau.name);
      resolve();
    });
  });
}

async function insertOfficeRecord (name, bureau_id) {
  await db.none(queries.insertOfficeRecord, [bureau_id, name]).catch(err => {
    console.log('Error updating record for office ' + name + ' for parent id ' + bureau_id, err);
  });
}

async function updateOfficeRecord (name, bureau_id, office_id) {
  await db.none(queries.updateOfficeRecord, [bureau_id, name, office_id]).catch(err => {
    console.log('Error updating record for office ' + name + ' for parent id ' + bureau_id, err);
  });
}

async function findBureauRecord (bureau) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findBureauRecord, [bureau.name]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for name ' + bureau.name);
      resolve();
    });
  });
}

async function findOfficeRecord (name) {
  return new Promise(resolve => {
    db.oneOrNone(queries.findOfficeRecord, [name]).then(async (record) => {
      resolve(record);
    }).catch(() => {
      console.log('Found multiple records for name ' + bureau.name);
      resolve();
    });
  });
}

/**
 * @param {Array} bureaus
 * @param {function} callback
 */
async function processBureaus (bureaus, callback) {
  var bureau = bureaus.pop();
  var record = await findBureauRecord(bureau); //, async (record, err) => {
  if (!record) {
    record = await insertBureauRecord(bureau);
  }

  for (var i = 0; i < bureau.offices.length; i++) {
    var key = bureau.offices[i];
    var officeRecord = await findOfficeRecord(key)
    if (!officeRecord) {
      await insertOfficeRecord(key, record.bureau_id);
    } else {
      await updateOfficeRecord(key, record.bureau_id, officeRecord.office_id);
    }
  }

  if (bureaus.length > 0) {
    processBureaus(bureaus, callback);
  } else {
    callback();
  }
}

module.exports = {
  /**
   * @param {function=} callback
   */
  import: function (callback) {
    var bureaus = require('./bureau-data.json');
    var numBureaus = bureaus.length;
    console.log('Importing data for bureaus and offices');

    processBureaus(bureaus, () => {
      console.log('Completed import of ' + numBureaus + ' records for bureaus.');
      pgp.end();
      callback && callback();
    });
  },
};