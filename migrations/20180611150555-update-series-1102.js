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
  var query = 'UPDATE "tagentity" ' +
    'SET "name" = \'1102 (Contracting/Acquisition)\', ' +
    '"data" = \'{"name":"1102 (Contracting/Acquisition)","series":"1102","title":"Contracting/Acquisition"}\' ' +
    'WHERE "name" = \'1102 (Contracting)\'';
  return db.runSql(query);
};

exports.down = function (db) {
  var query = 'UPDATE "tagentity" ' +
    'SET "name" = \'1102 (Contracting)\', ' +
    '"data" = \'{"name":"1102 (Contracting)","series":"1102","title":"Contracting"}\' ' +
    'WHERE "name" = \'1102 (Contracting/Acquisition)\'';
  return db.runSql(query);
};