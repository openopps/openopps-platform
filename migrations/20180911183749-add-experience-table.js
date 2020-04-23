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
  db.createTable('experience', {
    experience_id: { type: 'bigserial', primaryKey: true },
    application_id: { type: 'bigint', notNull: true },
    user_id: { type: 'bigint', notNull: true },
    country_id: { type: 'integer', notNull: true },
    country_subdivision_id: { type: 'integer', notNull: true },
    address_line_one: { type: 'character varying', notNull: true, defaultValue: '' },
    address_line_two: { type: 'character varying' },
    city_name: { type: 'character varying', notNull: true, defaultValue: '' },
    postal_code: { type: 'character varying', notNull: true, defaultValue: '' },
    duties: { type: 'character varying', notNull: true, defaultValue: '' },
    employer_name: { type: 'character varying', notNull: true, defaultValue: '' },
    formal_title: { type: 'character varying', notNull: true, defaultValue: '' },
    start_date: { type: 'timestamp with time zone' },
    end_date: { type: 'timestamp with time zone' },
    is_present: { type: 'boolean', notNull: true, defaultValue: false },
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db, callback) {
  db.dropTable('experience', callback);
};
