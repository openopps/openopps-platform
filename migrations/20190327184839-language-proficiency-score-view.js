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
  db.runSql(`
    create view language_proficiency_score as
      select
        lookup_code_id as proficiency_id,
        code,
        value,
        case 
          when value = 'None' then 0
          when value = 'Novice' then 1.1111111
          when value = 'Intermediate' then 2.2222222
          when value = 'Advanced' then 3.3333333
          else 0
        end as score
    from lookup_code
    where
      lookup_code_type = 'LANGUAGE_PROFICIENCY'
      and is_disabled = false
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop view language_proficiency_score', callback);
}

exports._meta = {
 'version': 1,
};