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

exports.up = function(db) {
  return Promise.all([
    db.addColumn('task', 'bureau_id', { type: 'bigint', 
      foreignKey: {
        name: 'task_bureau_id_fk',
        table: 'bureau',
        mapping: 'bureau_id',
        rules: {
          onDelete: 'RESTRICT'
        }
      } 
    }),
    db.addColumn('task', 'office_id', { type: 'bigint', 
      foreignKey: {
        name: 'task_office_id_fk',
        table: 'office',
        mapping: 'office_id',
        rules: {
          onDelete: 'RESTRICT'
        }
      } 
    }),
  ]);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
