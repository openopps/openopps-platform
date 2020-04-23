'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
  db.runSql(`
  with dup_tags as (
    select task_tags.task_tags, count(*), max(task_tags.id) as tag_id
    from tagentity_tasks__task_tags as task_tags
    join tagentity on tagentity.id = task_tags.tagentity_tasks
    where tagentity."type" = 'task-time-required' and task_tags.task_tags is not null
    group by task_tags.task_tags
    having count(*) > 1
    ), tags_to_remove as (
    select
      task_tags.id
    from tagentity_tasks__task_tags task_tags
    join tagentity on tagentity.id = task_tags.tagentity_tasks
    where tagentity."type" = 'task-time-required'
    and task_tags.task_tags in (select task_tags from dup_tags)
    and task_tags.id not in (select tag_id from dup_tags)
    )
    delete from tagentity_tasks__task_tags where id in (select id from tags_to_remove)
  `,
  callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
