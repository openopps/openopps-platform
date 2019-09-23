/*
 * This script will analyze the data in the task table looking
 * null or invalid data in the restrict column.
 *
 * Example of invalid restrict column data:
 *
 * {"abbr":"","slug":"","domain":".gov","projectNetwork":false}
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);
const _ = require('underscore');

const queries = {
  findTasks: 'with tasks as (select state, task.id, "userId", restrict from task ' +
    'where ' +
      'restrict is null ' +
      'or restrict::text = \'\' ' +
      'or (json(restrict)->>\'name\') = \'\' ' +
      'or (json(restrict)->>\'name\') is null ' +
    '), agencies as ( ' +
      'select user_tags.user_tags as "userId", agency.* from tagentity_users__user_tags user_tags ' +
      'join tagentity agency on agency.id = user_tags.tagentity_users and agency.type = \'agency\' ' +
      'where user_tags.user_tags in (select "userId" from tasks) ' +
    ') ' +
    'select tasks.*, agencies.data, agencies.name from tasks ' +
    'left join agencies on agencies."userId" = tasks."userId"',
  updateTask: 'update task set restrict = $1 where id = $2',
};

const restrict = {
  projectNetwork: false,
};

module.exports = {
  run: function (callback) {
    db.any(queries.findTasks).then(async (rows) => {
      console.log('[INFO] Found ' + rows.length + ' tasks with an invalid restrict column value.');
      for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        console.log('[INFO] Processing task record', row.id);
        var data = _.defaults(_.omit(_.extend(_.pick(row.data, 'abbr', 'domain', 'slug'), { name: row.name }), _.isEmpty), restrict);
        await db.none(queries.updateTask, [data, row.id]).then(() => {
          console.log('[INFO] Completed task record.');
        }).catch(err => {
          console.log('[ERROR] Error updating task record', err);
        });
      }
      pgp.end();
      console.log('[INFO] Completed correcting tasks with an invalid restrict column value.');
      callback();
    }).catch(err => {
      pgp.end();
      console.log('[ERROR] Error querying for tasks with an invalid restrict column value', err);
      callback(err);
    });
  },
};