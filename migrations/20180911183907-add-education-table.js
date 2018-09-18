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

exports.up = function (db, callback) {
  db.createTable('education', {
    education_id: { type: 'bigserial', primaryKey: true, autoIncrement: true },
    application_id: { type: 'bigint', notNull: true },
    user_id: { type: 'bigint',  notNull: true },
    school_name: { type: 'character varying', notNull: true, defaultValue: '' },
    city_name: { type: 'character varying', notNull: true, defaultValue: '' },
    postal_code: { type: 'character varying', notNull: true, defaultValue: '' },
    country_id: { type: 'integer', notNull: true },
    country_subdivision_id: { type: 'integer', notNull: true },
    degree_level_id: { type: 'integer', notNull: true },
    completion_month: { type: 'integer' },
    completion_year: { type: 'integer' },
    major: { type: 'character varying' },
    minor: { type: 'character varying' },
    gpa: { type: 'character varying', notNull: true, defaultValue: '' },
    gpa_max: { type: 'character varying', notNull: true, defaultValue: '' },
    total_credits_earned: { type: 'character varying' },
    credit_system: { type: 'character varying' },
    honors_id: { type: 'integer', notNull: true },
    course_work: { type: 'character varying' },
    is_currently_enrolled: { type: 'boolean', notNull: true, defaultValue: false },
    is_mininum_completed: { type: 'boolean', notNull: true, defaultValue: false },
    is_education_continued: { type: 'boolean', notNull: true, defaultValue: false },
    cumulative_gpa: { type: 'character varying', notNull: true, defaultValue: '' },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('education', callback);
};