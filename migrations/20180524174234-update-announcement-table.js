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
  db.renameColumn('announcement', 'content', 'title', (err) => {
    if(err) {
      callback(err);
    } else {
      db.addColumn('announcement', 'description', {
        type: 'text',
        notNull: true,
      }, callback);
    }
  });
};

exports.down = function (db, callback) {
  db.removeColumn('announcement', 'description', (err) => {
    if(err) {
      callback(err);
    } else {
      db.renameColumn('announcement', 'title', 'content', callback);
    }
  });
};