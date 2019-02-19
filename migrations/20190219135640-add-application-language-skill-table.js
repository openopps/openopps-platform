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
  db.createTable('application_language_skill', {
    application_language_skill_id: { type: 'bigserial', primaryKey: true },
    application_id: { type: 'bigint', notNull: true },
    user_id: { type: 'bigint', notNull: true },
    language_id: { type: 'integer', notNull: true },
    speaking_proficiency_id: { type: 'integer', notNull: true },
    writing_proficiency_id: { type: 'integer', notNull: true },
    reading_proficiency_id: { type: 'integer', notNull: true },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('application_language_skill', callback);
};