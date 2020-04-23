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

exports.up = function (db, callback) {
  db.runSql(`
    update community set banner = '{"title": "Cyber Open Opportunities", "subtitle": "You''re now viewing Cyber opportunities only.", "color": "#046b99"}' where "community_name" = 'Cyber Reskilling Academy Graduates'`,
    callback);
};

exports.down = function (db) {
  db.runSql(`
    update community set banner = '{}' where "community_name" = 'Cyber Reskilling Academy Graduates'`,
    callback);
};

exports._meta = {
  'version': 1,
};
