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

exports.up = function (db,callback) {
  db.createTable('user_bureau_office', {
    user_bureau_office_id: { type: 'bigserial', primaryKey: true },  
    user_id: { type: 'bigint', notNull: true },
    bureau_id: { type: 'bigint', 
      foreignKey: {
        name: 'user_bureau_office_bureau_id_fk',
        table: 'bureau',
        mapping: 'bureau_id',
        rules: {
          onDelete: 'RESTRICT',
        },
      },
    },
    office_id : { type: 'bigint', 
      foreignKey: {
        name: 'user_bureau_office_office_id_fk',
        table: 'office',
        mapping: 'office_id',
        rules: {
          onDelete: 'RESTRICT',
        },
      },
    },  
    created_at: { type: 'timestamp with time zone' },
    updated_at: { type: 'timestamp with time zone' },
  }, callback);
};

exports.down = function (db) {
  db.dropTable('user_bureau_office', callback);
};


