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

exports.up = function (db, callback) {
  process.env.DATA_IMPORT_URL = process.env.DATA_IMPORT_URL || 'https://data.usajobs.gov/api/codelist/';
  var baseDataImport = require('../utils/base-data');
  baseDataImport.import('all', callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};