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
  db.runSql(`
    delete from agency
  `, callback);
  db.insert('agency', [
    'agency_id',
    'name',
    'abbr',
    'domain',
    'slug',
    'allow_restrict_agency',
    'created_at',
    'code',
    'parent_code',
    'is_disabled'
  ], [
    2000,
    'California Department of Public Health',
    'CDPH',
    '',
    'cdph',
    true,
    new Date(),
    'CDPH',
    'CA',
    false
  ], callback);
  db.insert('agency', [
    'agency_id',
    'name',
    'abbr',
    'domain',
    'slug',
    'allow_restrict_agency',
    'created_at',
    'code',
    'parent_code',
    'is_disabled'
  ], [
    2001,
    'California Department of Social Services',
    'DSS',
    '',
    'dss',
    true,
    new Date(),
    'DSS',
    'CA',
    false
  ], callback);
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
