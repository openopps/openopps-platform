'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db, callback) {
	db.createTable('office', {
    office_id: {type: 'bigserial', primaryKey: true }, 
    bureau_id: { type: 'bigint', foreignKey: {
        name: 'office_parent_bureau_id_fk',
        table: 'bureau',
        mapping: 'bureau_id',
        rules: {
          onDelete: 'RESTRICT'
        }
      } 
    },
    name: { type: 'character varying', notNull: true, defaultValue:'' },
    last_modified: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('office', callback);
};

exports._meta = {
  "version": 1
};