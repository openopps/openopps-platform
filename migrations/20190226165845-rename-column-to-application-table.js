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
    db.renameColumn('application', 'is_mininum_completed', 'is_minimum_completed'),   
  ]);
};


exports.down = function (db) {
  return Promise.all([
    db.renameColumn('application', 'is_minimum_completed', 'is_mininum_completed'), 
  ]);  
};

