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
    CREATE OR REPLACE FUNCTION get_submittedopps(startdate date)
        RETURNS TABLE(submitted_date text, agency_id integer, cnt_opps_submitted bigint) 
        LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        to_char(t."submittedAt", 'YYYY-MM-DD') as submitted_date,
        COALESCE(t."agency_id", 0) as agency_id,
        COUNT(t."id") as cnt_opps_submitted
      FROM task as t
      WHERE t."submittedAt" IS NOT NULL
        AND t."createdAt" >= startdate::date
      GROUP BY to_char(t."submittedAt", 'YYYY-MM-DD'),
        COALESCE(t."agency_id", 0);
    END;
    $BODY$;
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_submittedopps(startdate date)');
};

exports._meta = {
  'version': 1,
};
