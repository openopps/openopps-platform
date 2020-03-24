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
    db.addColumn('community', 'usajobs_search_url', { type: 'character varying' }),
    db.addColumn('community', 'usajobs_search_url_label', { type: 'character varying' }),
  ]);
};
exports.down = function (db) {
  return Promise.all([
    db.removeColumn('community', 'usajobs_search_url'),
    db.removeColumn('community', 'usajobs_search_url_label'),
  ]);
};

exports._meta = {
  'version': 1
};