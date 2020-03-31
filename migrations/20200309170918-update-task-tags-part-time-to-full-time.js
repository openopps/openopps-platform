'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function (options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db,callback) {
  db.runSql(`
  with ptd as (
    select * from tagentity where type = 'task-time-required' and name = 'Part Time Detail'
  ), ftd as (
    select * from tagentity where type = 'task-time-required' and name = 'Full Time Detail'
  ) 
  update tagentity_tasks__task_tags
  set tagentity_tasks = (select max(id) from ftd)
  where tagentity_tasks in (select id from ptd)`,callback);
};

exports.down = function (db) {
  db.runSql(`
  with ptd as (
    select * from tagentity where type = 'task-time-required' and name = 'Part Time Detail'
  ), ftd as (
    select * from tagentity where type = 'task-time-required' and name = 'Full Time Detail'
  ) 
  update tagentity_tasks__task_tags
 set tagentity_tasks = (select max(id) from ptd)
 where tagentity_tasks in (select id from ftd)`,callback);
};


