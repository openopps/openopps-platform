/*
 * This script is used to merge duplicated agency records in the
 * tagentity table, and correct invalid agency abbreviations.
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);
const _ = require('underscore');

const queries = {
  parentAgencies: 'select * from tagentity ' +
    'where type = \'agency\' and data->>\'parentAbbr\' is null',
};

var getIDs = async function (abbr, agency) {
  var results = await db.any("SELECT id, name FROM tagentity where type = 'agency' and data->>'abbr' = $1", abbr);
  if (results.length) {
    return [
      _.findWhere(results, { name: agency }).id,
      _.reject(results, { name: agency }).map((obj) => { return obj.id; }).join(','),
    ];
  } else {
    return [0, 0];
  }
};

module.exports = {
  run: function (callback) {
    db.tx(t => {
      console.log('[INFO] Fixing agency abbreviations for T2, AOA, NHGRI, NGDC and NORAD...');
      var T2 = '{"allowRestrictAgency":true,"domain":"","abbr":"T2","slug":""}';
      var AOA = '{"allowRestrictAgency":true,"domain":"acl.gov","abbr":"AOA","slug":"acl"}';
      var NHGRI = '{"allowRestrictAgency":true,"domain":"genome.gov","abbr":"NHGRI","slug":"genome"}';
      var NGDC = '{"allowRestrictAgency":true,"domain":"ngdc.noaa.gov","abbr":"NGDC","slug":"ngdc.noaa"}';
      var NORAD = '{"allowRestrictAgency":false,"domain":"","abbr":"","slug":""}';
      var transactions = [
        t.none("UPDATE tagentity SET data = $1, name = 'National Center for Telehealth & Technology (T2)' " +
          "where type='agency' and name = 'National Center for Telehealth & Technology (T2) (DOD)'", T2),
        t.none("UPDATE tagentity SET data = $1, name = 'Administration on Aging (AOA)' " +
          "where type='agency' and name = 'Administration on Aging (HHS)'", AOA),
        t.none("UPDATE tagentity SET data = $1, name = 'National Human Genome Research Institute (NHGRI)' " +
          "where type='agency' and name = 'National Human Genome Research Institute (HHS)'", NHGRI),
        t.none("UPDATE tagentity SET data = $1, name = 'National Geophysical Data Center (NGDC)' " +
          "where type='agency' and name = 'National Geophysical Data Center (NOAA)'", NGDC),
        t.none("UPDATE tagentity SET data = $1, name = 'NORTHCOM/NORAD' " +
          "where type='agency' and name = 'NORTHCOM/NORAD (DOD)'", NORAD),
      ];
      return t.batch(transactions);
    }).then(async () => {
      console.log('[INFO] Merging duplicated agencies...');
      var BOP = await getIDs('BOP', 'DOJ Federal Bureau of Prisons (BOP)');
      var USAID = await getIDs('USAID', 'United States Agency for International Development (USAID)');
      var VA = await getIDs('VA', 'Department of Veterans Affairs (VA)');
      var query = 'UPDATE tagentity_users__user_tags SET tagentity_users = $1 where tagentity_users in ($2)';
      db.tx(t => {
        var transactions = [
          t.none(query, BOP),
          t.none(query, USAID),
          t.none(query, VA),
          t.none("DELETE FROM tagentity WHERE type='agency' and id in (" + [BOP[1], USAID[1], VA[1]].join(',') + ')'),
        ];
        return t.batch(transactions);
      }).then(async () => {
        pgp.end();
        callback();
      }).catch(err => {
        pgp.end();
        console.log('[ERROR] Error encountered merging agencies', err);
        callback(err);
      });
    }).catch(err => {
      pgp.end();
      console.log('[ERROR] Error encountered fixing agency abbreviations', err);
      callback(err);
    });
  },
};