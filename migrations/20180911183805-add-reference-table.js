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
  db.createTable('reference', {
    reference_id: { type: 'bigserial', primaryKey: true },
    application_id: { type: 'bigint', notNull: true },
    user_id: { type: 'bigint', notNull: true },
    reference_type_id: { type: 'integer', notNull: true },
    reference_name: { type: 'character varying', notNull: true, defaultValue: '' },
    reference_employer: { type: 'character varying' },
    reference_title: { type: 'character varying' },
    reference_phone: { type: 'character varying', notNull: true, defaultValue: '' },
    reference_email: { type: 'character varying', notNull: true, defaultValue: '' },
    is_reference_contact: { type: 'boolean', notNull: true, defaultValue: false },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('reference', callback);
};