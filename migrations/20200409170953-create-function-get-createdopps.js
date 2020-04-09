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
    CREATE OR REPLACE FUNCTION get_createdopps(startdate date)
        RETURNS TABLE(created_date text, agency_id integer, cnt_opps_created bigint) 
        LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        to_char(t."createdAt", 'YYYY-MM-DD') as created_date,
        COALESCE(t."agency_id", 0) as agency_id,
        COUNT(t."id") as cnt_opps_created
      FROM task as t
      WHERE t."createdAt" IS NOT NULL
        AND t."createdAt" >= startdate::date
      GROUP BY to_char(t."createdAt", 'YYYY-MM-DD'),
        COALESCE(t."agency_id", 0);
    END; $BODY$
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_createdopps(startdate date)');
};

exports._meta = {
  'version': 1,
};
