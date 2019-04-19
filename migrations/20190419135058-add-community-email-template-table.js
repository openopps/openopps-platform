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
  db.createTable('community_email_template', {
    community_email_template_id: {type: 'bigserial', primaryKey: true },
    community_id: { type: 'bigint', foreignKey: {
      name: 'community_email_template_community_fk',
      table: 'community',
      mapping: 'community_id',
      rules: {
        onDelete: 'CASCADE',
      },
    } },
    action: { type: 'character varying' },
    template: { type: 'character varying' },
    layout: { type: 'character varying' },
    created_at: { type: 'timestamp with time zone', notNull: true, defaultValue: new String('CURRENT_TIMESTAMP') },
  }, callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
