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
    CREATE OR REPLACE FUNCTION get_appsbyagencyanddate(startdate date)
        RETURNS TABLE(application_date text, agency_id integer, cnt_opps_applications bigint, cnt_opps_selections bigint) 
        LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        to_char(v."createdAt", 'YYYY-MM-DD') as application_date,
        COALESCE(t."agency_id", 0) as agency_id,
        COUNT(v."id") as cnt_opps_applications,
        SUM(CASE WHEN v."assigned" = 'true'THEN 1 ELSE 0 END) as cnt_opps_selections
      FROM volunteer as v
      INNER JOIN task as t
        ON v."taskId" = t."id"
        Where v."createdAt" >= startdate::date
      GROUP BY to_char(v."createdAt", 'YYYY-MM-DD'),
        COALESCE(t."agency_id", 0);
    END; $BODY$
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_appsbyagencyanddate(startdate date)');
};

exports._meta = {
  'version': 1,
};
