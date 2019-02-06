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
    db.removeColumn('education', 'is_currently_enrolled'),
    db.removeColumn('education', 'is_mininum_completed'),
    db.removeColumn('education', 'is_education_continued'),
    db.removeColumn('education', 'cumulative_gpa'),
    db.changeColumn('education', 'honors_id', { type: 'integer'}),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.addColumn('education', 'is_currently_enrolled', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('education', 'is_mininum_completed', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('education', 'is_education_continued', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('education', 'cumulative_gpa',{ type: 'character varying', notNull: true, defaultValue: '' }),
    db.changeColumn('education', 'honors_id', { type: 'integer', notNull:true }),
  ]);
};

exports._meta = {
  'version': 1,
};
