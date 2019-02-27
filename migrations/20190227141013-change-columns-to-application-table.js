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
    db.changeColumn('application', 'is_currently_enrolled', { type: 'boolean' }),
    db.changeColumn('application', 'is_minimum_completed', { type: 'boolean' }),
    db.changeColumn('application', 'is_education_continued', { type: 'boolean' }),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.changeColumn('application', 'is_currently_enrolled', { type: 'boolean', notNull: true, defaultValue: false }),
    db.changeColumn('application', 'is_minimum_completed', { type: 'boolean', notNull: true, defaultValue: false }),
    db.changeColumn('application', 'is_education_continued', { type: 'boolean', notNull: true, defaultValue: false }),
  ]);
};


