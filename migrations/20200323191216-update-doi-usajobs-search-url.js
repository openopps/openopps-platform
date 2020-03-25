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
  return db.runSql(`update community set usajobs_search_url = 'https://www.usajobs.gov/Search/?d=IN&hp=fed-internal-search&p=1', usajobs_search_url_label = 'DOI jobs' where community_name = 'DOI Career Connection (DCC)'`);
};

exports.down = function (db) {
  return db.runSql(`update community set usajobs_search_url = '', usajobs_search_url_label = '' where community_name = 'DOI Career Connection (DCC)'`);
};

exports._meta = {
  'version': 1,
};