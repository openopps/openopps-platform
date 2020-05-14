'use strict';

var _ = require('lodash');
var yaml = require('js-yaml');
var fs = require('fs');

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

exports.up = function(db, callback) {
  db.runSql(`
    delete from agency
  `, callback);

  var agencyFile = 'tools/init-tag-data/agency.yml';
  if (fs.existsSync(agencyFile)) {
    var agencyFileObjects = yaml.safeLoad(fs.readFileSync(agencyFile).toString());
    agencyFileObjects.forEach(agency => {
	  db.insert('agency', [
	    'name',
	    'abbr',
	    'domain',
	    'slug',
	    'allow_restrict_agency',
	    'created_at',
	    'code',
	    'parent_code',
	    'is_disabled'
	  ], [
	    agency.title,
	    agency.acronym,
	    '',
	    agency.acronym.toLowerCase(),
	    true,
	    new Date(),
	    agency.acronym,
	    'CA',
	    false
	  ], callback);
    });
  } else {
  	throw "No agency file";
  }
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
