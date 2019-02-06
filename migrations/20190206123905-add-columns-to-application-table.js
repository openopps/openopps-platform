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
    db.addColumn('application', 'is_currently_enrolled', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('application', 'is_mininum_completed', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('application', 'is_education_continued', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('application', 'cumulative_gpa', { type: 'character varying', notNull: true, defaultValue: '' }),
     
  ]);
};
exports.down = function (db) {
  return Promise.all([
    db.removeColumn('application', 'is_currently_enrolled'),
    db.removeColumn('application', 'is_mininum_completed'),
    db.removeColumn('application', 'is_education_continued'),
    db.removeColumn('application', 'cumulative_gpa'),
  ]);
};

exports._meta = {
  'version': 1
};
