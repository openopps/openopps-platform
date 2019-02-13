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
    db.removeColumn('application', 'overseas_experience_type_id'),
    db.removeColumn('application', 'is_contact_security_clearance'),
    db.addColumn('application', 'overseas_experience_types', { type: 'jsonb' }),
    db.addColumn('application', 'security_clearance_issuer', { type: 'character varying' }),
    db.addColumn('application', 'has_vsfs_experience', { type: 'boolean' })
  ]);
};

exports.down = function(db) {
  return Promise.all([
    db.addColumn('application', 'overseas_experience_type_id', { type: 'boolean' }),
    db.addColumn('application', 'is_contact_security_clearance', { type: 'boolean' }),
    db.removeColumn('application', 'overseas_experience_types'),
    db.removeColumn('application', 'security_clearance_issuer'),
    db.removeColumn('application', 'has_vsfs_experience')
  ]);
};

exports._meta = {
  "version": 1
};
