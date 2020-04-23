/*
 * This script will analyze the data in the tagentity table looking
 * for agency data. It will convert agency type tags to agency records
 * in the new agency table.
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);
const _ = require('underscore');

const queries = {
  parentAgencies: 'select * from tagentity ' +
    'where type = \'agency\' and data->>\'parentAbbr\' is null',
  childAgencies: 'select * from tagentity ' +
    'where type = \'agency\' and data->>\'parentAbbr\' is not null',
  findAgency: 'select id from agency where abbr = $1',
};

var convertTagentityRecord = function (record) {
  return _.extend(_.omit(record, ['id', 'type', 'deletedAt', 'data']), {
    abbr: record.data.abbr || '',
    domain: record.data.domain || '',
    slug: record.data.slug || '',
    allowRestrictAgency: _.isNull(record.data.allowRestrictAgency) ? true : record.data.allowRestrictAgency,
  });
};

var createInsertStatement = function (agency) {
  agency.createdAt = (agency.createdAt || new Date()).toISOString();
  agency.updatedAt = (agency.updatedAt || new Date()).toISOString();
  return 'INSERT INTO agency (' +
    '"' + Object.keys(agency).join('","') + '") VALUES (' +
    "'" + Object.values(agency).join("','") + "')";
};

var migrateRecords = async function (records, hasParent) {
  for(var i = 0; i < records.length; i++) {
    var record = records[i];
    console.log('[INFO] Processing agency record', record.id);
    var agency = convertTagentityRecord(record);
    if(hasParent) {
      agency.parent = (await db.one(queries.findAgency, record.data.parentAbbr)).id;
    }
    var insert = createInsertStatement(agency);
    console.log('[INFO] Inserting agency record', insert);
    await db.none(insert).then(() => {
      console.log('[INFO] Completed agency record.');
    }).catch(err => {
      console.log('[ERROR] Error inserting agency record', err);
    });
  }
};

module.exports = {
  run: function (callback) {
    db.any(queries.parentAgencies).then(async (rows) => {
      console.log('[INFO] Found ' + rows.length + ' agencies that have no parent. Migrating these first...');
      await migrateRecords(rows);
      db.any(queries.childAgencies).then(async (rows) => {
        console.log('[INFO] Found ' + rows.length + ' agencies that have a parent. Migrating these now...');
        await migrateRecords(rows, true);
        pgp.end();
        console.log('[INFO] Completed agency data migration.');
        callback();
      }).catch(err => {
        pgp.end();
        console.log('[ERROR] Error querying for agencies that have a parent', err);
        callback(err);
      });
    }).catch(err => {
      pgp.end();
      console.log('[ERROR] Error querying for agencies that have no parent', err);
      callback(err);
    });
  },
};