/*
 * This script will analyze the data in the task table looking
 * for possible FAI community data. Any task marked with the
 * Acquisition career field will be attached to the FAI community.
 * The task creators will be made members of the FAI community. 
 */

const _ =  require('lodash');
const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../../database.json').dev;
const db = pgp(connection);

const queries = {
  findCommunity: 'SELECT community_id as id FROM community ' +
    'WHERE community_name = \'Federal Acquisition Professionals\'',
  findTasks: 'SELECT task.id, task."userId" FROM task ' +
    'JOIN tagentity_tasks__task_tags ON task_tags = task.id ' +
    'JOIN tagentity ON tagentity.id = tagentity_tasks ' +
    'WHERE tagentity.type = \'career\' AND tagentity.name = \'Acquisition\'',
  insertCommunityUser: 'INSERT INTO community_user ' +
    '(community_id, user_id, is_manager, created_at, updated_at) ' +
    'VALUES ($1, $2, $3, $4, $4)',
  updateTask: 'UPDATE task SET community_id = $1 WHERE id = $2',
};

module.exports = {
  run: function (callback) {
    db.one(queries.findCommunity).then(async (community) => {
      await db.any(queries.findTasks).then(async (rows) => {
        console.log('[INFO] Found ' + rows.length + ' acquisition opportunities.');
        var users = _.uniq(rows.map(row => { return row.userId; }));
        console.log('[INFO] Found ' + users.length + ' unique users. Migrating these first...');
        users.forEach(async (user) => {
          await db.none(queries.insertCommunityUser, [community.id, user, false, new Date()]).catch(err => {
            console.log('[ERROR] Error migrating user ' + user, err);
          });
        });
        console.log('Migrating opportunities...');
        rows.forEach(async (row) => {
          await db.none(queries.updateTask, [community.id, row.id]).catch(err => {
            console.log('[ERROR] Error migrating opportunity ' + row.id, err);
          });
        });
        pgp.end();
        callback();
      }).catch(err => {
        pgp.end();
        console.log('[ERROR] Error querying for acquisition opportunities', err);
        callback(err);
      });
    }).catch(err => {
      pgp.end();
      console.log('[WARNING] Could not find acquisition community', err);
      callback();
    });
  },
};
