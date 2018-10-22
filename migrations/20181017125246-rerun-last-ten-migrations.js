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
  var dbmi = dbm.getInstance(true);
  dbmi.down(10, (err) => {
    if (err) {
      callback(err);
    } else {
      console.log('successfully rolled back 10 migrations.');
      dbmi.up(10, (err) => {
        if (err) {
          callback(err);
        } else {
          console.log('successfully ran 10 migrations.');
          callback();
        }
      });
    }
  });
};

exports.down = function (db) {
  return null;
};
