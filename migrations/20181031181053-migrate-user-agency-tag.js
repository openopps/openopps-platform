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
  var userAgencyQuery = 'select ' +
      'midas_user.id as user_id, ' +
      'midas_user.name as user_name, ' +
      'tagentity.id as tagentity_id, ' +
      'tagentity.name as tagentity_name, ' +
      'user_tags.id as user_tags_id, ' +
      'agency.agency_id, ' +
      'agency.code, ' +
      'agency.name as agency_name ' +
    'from tagentity ' +
    'join agency on agency.old_name = tagentity.name ' +
    'join tagentity_users__user_tags user_tags on tagentity_users = tagentity.id ' +
    'join midas_user on midas_user.id = user_tags ' +
    'order by code';
  db.all(userAgencyQuery, (err, results) => {
    if (err) {
      callback(err);
    } else {
      Promise.all(results.map(result => {
        return db.runSql('UPDATE midas_user SET agency_id = ? WHERE id = ?', [result.agency_id, result.user_id]);
      })).then(() => {
        callback();
      }).catch((err) => {
        console.log('An error occured updating some user records');
        callback();
      });
    }
  });
};

exports.down = function (db) {
  return null;
};

exports._meta = {
  'version': 1,
};
