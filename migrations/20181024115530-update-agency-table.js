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
    db.renameColumn('agency', 'id', 'agency_id'),
    db.removeColumn('agency', 'allowInternships'),
    db.removeColumn('agency', 'parent'),
    db.addColumn('agency', 'parent_code', { type: 'character varying' }),
    db.addColumn('agency', 'code', { type: 'character varying', notNull: true, defaultValue: '' }),
    db.addColumn('agency', 'is_disabled', { type: 'boolean', notNull: true, defaultValue: false }),
    db.renameColumn('agency', 'allowRestrictAgency', 'allow_restrict_agency'),
    db.renameColumn('agency', 'createdAt', 'created_at'),
    db.renameColumn('agency', 'updatedAt', 'updated_at'),
  ]);
};

exports.down = function (db) {
  return Promise.all([
    db.renameColumn('agency', 'agency_id', 'id'),
    db.addColumn('agency', 'allowInternships', { type: 'boolean', notNull: true, defaultValue: false }),
    db.addColumn('agency', 'parent', { type: 'integer' }),
    db.removeColumn('agency', 'parent_code'),
    db.removeColumn('agency', 'code'),
    db.removeColumn('agency', 'is_disabled'),
    db.renameColumn('agency', 'allow_restrict_agency', 'allowRestrictAgency'),
    db.renameColumn('agency', 'created_at', 'createdAt'),
    db.renameColumn('agency', 'updated_at', 'updatedAt'),
  ]);
};