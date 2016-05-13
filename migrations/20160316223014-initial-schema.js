'use strict';

var dbm;
var type;
var seed;
var fs = require('fs');
var path = require('path');
var Promise;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
  Promise = options.Promise;
};

exports.up = function(db, callback) {
  console.log('up initial schema');
  var filePath = path.join(__dirname + '/sqls/20160316223014-initial-schema-up.sql');
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data) {
    if (err) return callback(err);
    console.log('received data: ' + data);
    return db.runSql(data, callback);
  });
};

exports.down = function(db, callback) {
  var filePath = path.join(__dirname + '/sqls/20160316223014-initial-schema-down.sql');
  fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data) {
    if (err) return callback(err);
    console.log('received data: ' + data);
    return db.runSql(data, callback);
  });
};
