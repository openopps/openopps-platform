/*
 * This script will analyze the data in the tagentity table looking
 * for possible agency parent child relationships.
 * 
 * The parent is a record who's abbreviation value in the data column
 * is the start of another agency record's name column.
 * 
 * Example:
 * Department of Education (ED) - parent
 * ED Federal Student Aid (FAFSA) - child
 * ED Institute of Education Sciences (IES) - child
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);

const queries = {
  findParentChild: 'with abbrs as ( ' +
    'select data->>\'abbr\' as abbr from tagentity ' +
    'where type = \'agency\' and data->>\'abbr\' <> \'\') '+
    'select abbrs.*, tag.* from tagentity tag ' +
    'join abbrs on tag.name like (abbrs.abbr || \'%\') ' +
    'where tag.type = \'agency\'',
  updateAgency: 'update tagentity set data = $1 where id = $2',
};

module.exports = {
  run: function (callback) {
    db.any(queries.findParentChild).then(async (rows) => {
      console.log('[INFO] Found ' + rows.length + ' parent child relationships for agencies.');
      for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        console.log('[INFO] Processing agency record', row.id);
        var data = row.data;
        data.parentAbbr = row.abbr;
        await db.none(queries.updateAgency, [data, row.id]).then(() => {
          console.log('[INFO] Completed agency record.');
        }).catch(err => {
          console.log('[ERROR] Error updating agency record', err);
        });
      }
      pgp.end();
      console.log('[INFO] Completed parent child relationships for agencies.');
      callback();
    }).catch(err => {
      pgp.end();
      console.log('[ERROR] Error querying for parent child relationships for agencies', err);
      callback(err);
    });
  },
};
