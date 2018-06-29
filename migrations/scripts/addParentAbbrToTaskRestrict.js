/*
 * This script will analyze the data in the task table looking
 * for task retricted to agencies that have a parent agency. It
 * will add the parentAbbr to the restrict column for any
 * relevant task found.
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);
const _ = require('underscore');

const queries = {
  findTasks: 'with agencies as ( ' +
      'select name, data->>\'abbr\' as abbr, data->>\'parentAbbr\' as "parentAbbr" from tagentity ' +
      'where type = \'agency\' and (data->>\'parentAbbr\') is not null ' +
    ') ' +
    'select task.id, restrict, agencies.* from task ' +
    'join agencies on agencies.name = JSON(task.restrict)->>\'name\'',
  updateTask: 'update task set restrict = $1 where id = $2',
};

const restrict = {
  projectNetwork: false,
};

module.exports = {
  run: function (callback) {
    db.any(queries.findTasks).then(async (rows) => {
      console.log('[INFO] Found ' + rows.length + ' tasks with an agency that has a parent.');
      for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        console.log('[INFO] Processing task record', row.id);
        var restrict = _.extend(row.restrict, { parentAbbr: row.parentAbbr });
        await db.none(queries.updateTask, [restrict, row.id]).then(() => {
          console.log('[INFO] Completed task record.');
        }).catch(err => {
          console.log('[ERROR] Error updating task record', err);
        });
      }
      pgp.end();
      console.log('[INFO] Completed updating tasks with an agency that has a parent.');
      callback();
    }).catch(err => {
      pgp.end();
      console.log('[ERROR] Error querying for tasks with an agency that has a parent', err);
      callback(err);
    });
  },
};