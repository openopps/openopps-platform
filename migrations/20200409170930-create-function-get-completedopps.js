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
  return db.runSql(`
    CREATE OR REPLACE FUNCTION get_completedopps(startdate date)
        RETURNS TABLE(completed_date text, agency_id integer, cnt_opps_completed bigint) 
        LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        to_char(t."completedAt", 'YYYY-MM-DD') as completed_date,
        COALESCE(t."agency_id", 0) as agency_id,
        COUNT(t."id") as cnt_opps_completed
      FROM task as t
      WHERE t."completedAt" IS NOT NULL
        AND t."completedAt" >= startdate::date
      GROUP BY to_char(t."completedAt", 'YYYY-MM-DD'),
        COALESCE(t."agency_id", 0);
    END; $BODY$
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_completedopps(startdate date)');
};

exports._meta = {
  'version': 1,
};
