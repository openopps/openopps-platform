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
  return db.createTable('alert_location_bridge', {
    alert_location_bridge_id: { type: 'int', primaryKey: true, autoIncrement: true },
    alert_id: { type: 'int', notNull: true, foreignKey: {
      name: 'alert_id_fk',
      table: 'alert',
      mapping: 'alert_id',
      rules: {
        onDelete: 'CASCADE',
      },
    }},
    alert_location_id: { type: 'int', notNull: true, foreignKey: {
      name: 'alert_location_id_fk',
      table: 'alert_location',
      mapping: 'alert_location_id',
      rules: {
        onDelete: 'CASCADE',
      },
    }},
    updated_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  });
};

exports.down = function (db) {
  return db.dropTable('alert_location_bridge');
};

exports._meta = {
  'version': 1,
};
