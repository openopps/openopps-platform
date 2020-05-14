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
    delete from tagentity where type = 'series' 
  `, callback);

  var tags = [];
  var tagFile = 'tools/init-tag-data/series.yml';
  if (fs.existsSync(tagFile)) {
    var tagFileObjects = yaml.safeLoad(fs.readFileSync(tagFile).toString());
    tags = _.map(tagFileObjects, function (item) {
      return {
        name: item.title + " (" + item.code + ")",
        series: item.code,
        title: item.title
      }
    });
    tags.forEach(tag => {
      var query = `insert into tagEntity("type", "name", "data", "createdAt", "updatedAt") select 'series', $1, $2, NOW(), NOW() where not exists (select id from tagEntity where name = $1 and type = 'series')`; 
      db.runSql(query, [tag.name, JSON.stringify(tag)], callback);
    });
  }
};

exports.down = function(db) {
  return null;
};

exports._meta = {
  "version": 1
};
