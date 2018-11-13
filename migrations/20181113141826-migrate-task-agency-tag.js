'use strict';

var dbm;
var type;
var seed;

const userTaskQuery = 'select ' +
  'restrict->>\'name\' as restrict_name, agency.agency_id, agency.name ' +
  'from task ' +
  'left join agency on agency.old_name = restrict->>\'name\' ' +
  'where restrict->>\'name\' is not null and agency.name <> \'\' ' +
  'group by restrict->>\'name\', agency.agency_id, agency.name';

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
  db.addColumn('task', 'agency_id', { type: 'integer' }, (err) => {
    if (err) {
      callback(err);
    } else {
      db.all(userTaskQuery, (err, results) => {
        if (err) {
          callback(err);
        } else {
          Promise.all(results.map(result => {
            return db.runSql('UPDATE task SET agency_id = ? WHERE restrict->>\'name\' = ?', [result.agency_id, result.restrict_name]);
          })).then(() => {
            callback();
          }).catch((err) => {
            console.log('An error occured updating some task records');
            callback();
          });
        }
      });
    }
  });
};

exports.down = function (db) {
  return db.removeColumn('task', 'agency_id');
};

exports._meta = {
  'version': 1,
};
