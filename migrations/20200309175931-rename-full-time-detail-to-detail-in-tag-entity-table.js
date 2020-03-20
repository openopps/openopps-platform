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

exports.up = function (db) {
  return Promise.all([
    db.runSql(`update tagentity set name = 'Detail' where type = 'task-time-required' and name='Full Time Detail' `),
    db.runSql(`delete from tagentity where type='task-time-required' and name='Part Time Detail' `),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.runSql(`update tagentity set name = 'Full Time Detail' where type = 'task-time-required' and name ='Detail' `),
  ]);
};


