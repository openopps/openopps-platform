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

exports.up = function(db, callback) {
  db.runSql(`
    alter table public.application 
    alter column cumulative_gpa drop default,
    alter column cumulative_gpa set data type numeric(4,3) using (cast((coalesce(nullif(regexp_replace(cumulative_gpa, '[^0-9.]+', '', 'g'), ''), '0')) as numeric(4,3))),
    alter column cumulative_gpa set default 0;
  `)
  db.addColumn('language_skill', 'weight_factor', { type: 'float(4)', defaultValue: '1' });
  db.addColumn('application', 'random_factor', { type: 'numeric(30,29)', notNull: true, defaultValue: new String(`cast(concat(floor(random() * 10),'.',substr(cast(random() as text),3,14), substr(cast(random() as text),3,15)) as numeric(30,29))`) });
  db.addColumn('task', 'gpa_weight', { type: 'float(4)', defaultValue: '1' });
  return db.addColumn('task', 'random_weight', { type: 'float(4)', defaultValue: '1' });
};

exports.down = function(db) {
  db.removeColumn('language_skill', 'weight_factor');
  db.removeColumn('application', 'random_factor');
  db.removeColumn('task', 'gpa_weight');
  return db.removeColumn('task', 'random_weight');
};

exports._meta = {
  "version": 1
};