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

exports.up = function (db,callback) {
  return Promise.all([
    db.addColumn('task', 'grade', { type: 'integer' }),
    db.addColumn('task', 'pay_level_id', { type: 'integer' }),  
    db.addColumn('task', 'apply_additional', {
      type: 'text',
    }, callback), 
    db.addColumn('task', 'requirement', {
      type: 'text',
    }, callback), 
    db.addColumn('task', 'is_detail_reimbursable', { type: 'boolean'}),
  ]);
};

exports.down = function (db,callback) {
  return Promise.all([
    db.removeColumn('task', 'grade'),
    db.removeColumn('task', 'pay_level_id'),
    db.removeColumn('task', 'apply_additional',callback),
    db.removeColumn('task', 'requirement',callback),
    db.removeColumn('task', 'is_detail_reimbursable'),

  ]);
};


