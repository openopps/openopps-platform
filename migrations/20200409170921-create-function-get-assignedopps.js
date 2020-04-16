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
    CREATE OR REPLACE FUNCTION get_assignedopps(startdate date)
      RETURNS TABLE(assigned_date text, agency_id integer, cnt_opps_assigned bigint) 
      LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT 
        to_char(t."assignedAt", 'YYYY-MM-DD') as assigned_date,
        COALESCE(t."agency_id", 0) as agency_id,
        COUNT(t."id") as cnt_opps_assigned
      FROM task as t
      WHERE t."assignedAt" IS NOT NULL
        AND t."assignedAt" >= startdate
      GROUP BY to_char(t."assignedAt", 'YYYY-MM-DD'),
        COALESCE(t."agency_id", 0);
    END; $BODY$
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_assignedopps(startdate date)');
};

exports._meta = {
  'version': 1,
};
