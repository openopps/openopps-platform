/*
 * This script will analyze the data in the tagentity table looking
 * for duplicate records. Records are considered a duplicate if
 * there exists a duplicated name value (case insensative) of the
 * same type value. For each duplicate found the script will find
 * the lowest primary key (id) and then update all references from
 * tagentity_tasks__task_tags and tagentity_users__user_tags to
 * point to the lowest primary key. All duplicates where the primary
 * key does not match the lowest primary key are then deleted.
 */

const pgp = require('pg-promise')();
const connection = process.env.DATABASE_URL || require('../database.json').dev;
const db = pgp(connection);

const queries = {
  findDuplicates: 'select count(*) as count, min(id) as key, type, lower(name) as name ' +
    'from tagentity group by type, lower(name) having count(*) > 1 order by count desc',
  updateTaskTags: 'update tagentity_tasks__task_tags set tagentity_tasks = $1 where ' +
    'tagentity_tasks in (select id from tagentity where type = $2 and lower(name) = $3)',
  updateUserTags: 'update tagentity_users__user_tags set tagentity_users = $1 where ' +
    'tagentity_users in (select id from tagentity where type = $2 and lower(name) = $3)',
  deleteDuplicates: 'delete from tagentity where id <> $1 and type = $2 and lower(name) = $3',
};

db.any(queries.findDuplicates).then(rows => {
  console.log('Found ' + rows.length + ' duplicate tag entities.');
  rows.forEach(row => {
    console.log('Processing tag', JSON.stringify(row, null, 2));
    db.none(queries.updateTaskTags, [row.key, row.type, row.name]).then(() => {
      db.none(queries.updateUserTags, [row.key, row.type, row.name]).then(() => {
        db.none(queries.deleteDuplicates, [row.key, row.type, row.name]).then(() => {
          console.log('Completed tag', JSON.stringify(row, null, 2));
        }).catch(err => {
          console.log('Error deleting duplicate tags', err);
        });
      }).catch(err => {
        console.log('Error updating user tags', err);
      });
    }).catch(err => {
      console.log('Error updating task tags', err);
    });
  });
}).catch(err => {
  console.log('Error querying for duplicates', err);
});
