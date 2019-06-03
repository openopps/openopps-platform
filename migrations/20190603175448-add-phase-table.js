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

exports.up = function (db, callback) {
  db.createTable('phase', {
    phase_id: { type: 'bigserial', primaryKey: true },
    name: { type: 'text', notNull: true, defaultValue: '' },
    description: { type: 'text', notNull: true, defaultValue: '' },     
    sequence: { type: 'integer', notNull: true, defaultValue: 1},
    config: { type: 'jsonb', notNull: true, defaultValue: '{}' },
  }, callback );
}

exports.down = function (db, callback) {
  db.dropTable('phase', callback);
}

exports._meta = {
 'version': 1,
};
