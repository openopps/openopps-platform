'use strict';

var dbTools = require('../tools/lib/dbTools');
var path = require('path');
var fs = require('fs');
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
  var file = path.join(__dirname,  '../tools/init-tag-data/career.txt');
  dbTools.importTagsFromFile(file, 'career').then(function () {
    callback();
  }).catch(function (err) {
    if (err) {
      console.log('Failed with error: ', err);
      dbTools.end();
    }
  });
};

exports.down = function (db) {
  var query = 'delete from tagentity where type = \'career\'';
  return db.runSql(query);
};