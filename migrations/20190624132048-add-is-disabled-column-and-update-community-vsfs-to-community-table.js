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
  return Promise.all([
    db.addColumn('community', 'is_disabled', { type: 'boolean', notNull: true, defaultValue: false }),
    db.runSql('UPDATE community SET is_disabled = true where community_name = \'Virtual Student Federal Service (VSFS)\''),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.removeColumn('community', 'is_disabled'),
    db.runSql('UPDATE community SET is_disabled = false where community_name = \'Virtual Student Federal Service (VSFS)\''),
  ]);

};
