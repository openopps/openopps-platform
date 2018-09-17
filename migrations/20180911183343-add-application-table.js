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
  db.createTable('application', {
    application_id: { type: 'bigserial', primaryKey: true, autoIncrement: true },
    user_id: { type: 'bigint', notNull: true },
    statement_of_interest: { type: 'character varying', notNull: true, defaultValue: '' },   
    is_consent_to_share: { type: 'boolean' },
    has_overseas_experience: { type: 'boolean' },
    overseas_experience_type_id: { type: 'integer', notNull: true },
    overseas_experience_other: { type: 'character varying', notNull: true, defaultValue: '' },
    overseas_experience_length: { type: 'character varying', notNull: true, defaultValue: '' },
    has_security_clearance: { type: 'boolean' },
    security_clearance_id: { type: 'integer', notNull: true },
    is_contact_security_clearance: { type: 'boolean' },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
    submitted_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('application', callback);
};
