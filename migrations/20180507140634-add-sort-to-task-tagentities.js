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
  var query = 'update tagentity ' +
    'set data = ? ' +
    'where type = ? and name = ?';
  var addSort = function (objects, err) {
    if (err) {
      callback(err);
      return;
    }
    var object = objects.pop();
    db.runSql(query, [object.data, object.type, object.name], (err) => {
      if(objects.length) {
        addSort(objects, err);
      } else {
        callback(err);
      }
    });
  };
  addSort([
    { name: 'Weekly', type: 'task-length', data: { sort: 1 } },
    { name: 'Biweekly', type: 'task-length', data: { sort: 2 } },
    { name: 'Monthly', type: 'task-length', data: { sort: 3 } },
    { name: '1 person', type: 'task-people', data: { sort: 1 } },
    { name: '2 - 5 people', type: 'task-people', data: { sort: 2 } },
    { name: '5+ people', type: 'task-people', data: { sort: 3 } },
    { name: 'A Team', type: 'task-people', data: { sort: 4 } },
    { name: 'Less than 1 hour', type: 'task-time-estimate', data: { sort: 1 } },
    { name: 'Up to 2 hours', type: 'task-time-estimate', data: { sort: 2 } },
    { name: '2 - 4 hours', type: 'task-time-estimate', data: { sort: 3 } },
    { name: '4 - 8 hours', type: 'task-time-estimate', data: { sort: 4 } },
    { name: '8 - 16 hours', type: 'task-time-estimate', data: { sort: 5 } },
    { name: '16 - 24 hours', type: 'task-time-estimate', data: { sort: 6 } },
    { name: '24 - 40 hours', type: 'task-time-estimate', data: { sort: 7 } },
  ]);
};

exports.down = function (db) {
  return db.runSql('update tagentity set data = null where type in ("task-length", "task-people", "task-time-estimate")');
};