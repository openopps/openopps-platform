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
  return db.addColumn('cycle', 'phase_id', { type: 'int8', 
    foreignKey: {
      name: 'cycle_phase_id_fk',
      table: 'phase',
      mapping: 'phase_id',
      rules: {
        onDelete: 'RESTRICT'
      }
    }
  });
};

exports.down = function(db) {
  return db.removeColumn('cycle', 'phase_id');
};

exports._meta = {
  "version": 1
};
