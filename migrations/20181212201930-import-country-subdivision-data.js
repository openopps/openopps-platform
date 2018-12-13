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
  var countrySubdivisionDataImport = require('../utils/countrysubdivision-data');
  countrySubdivisionDataImport.import(callback);
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};