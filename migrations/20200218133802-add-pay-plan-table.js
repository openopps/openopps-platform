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
  return db.createTable('pay_plan', {
    pay_plan_id: { type: 'int', primaryKey: true, autoIncrement: true }, 
    code: { type: 'character varying', notNull: true, defaultValue:'' },
    value: { type: 'character varying', notNull: true,defaultValue:'' },
    is_disabled: { type: 'boolean', notNull: true, defaultValue: false },
    sort_order: { type: 'int', notNull: true, defaultValue: 1 },
    last_modified: { type: 'timestamp with time zone' },
  });
};

exports.down = function (db) {
  return db.dropTable('pay_plan');
};

exports._meta = {
  'version': 1,
};
