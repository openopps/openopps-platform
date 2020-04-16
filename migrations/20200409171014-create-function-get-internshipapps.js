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
    CREATE OR REPLACE FUNCTION get_internshipapps(startdate date)
      RETURNS TABLE(application_date text, agency_id integer, cnt_intern_applications bigint) 
      LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        to_char(a."submitted_at", 'YYYY-MM-DD') as application_date,
        0 as agency_id,
        COUNT(a."application_id") as cnt_intern_applications
      FROM application as a
      WHERE a."submitted_at" IS NOT NULL
        AND a."submitted_at" >= startdate::date
      GROUP BY to_char(a."submitted_at", 'YYYY-MM-DD');
    END;
    $BODY$;
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_internshipapps(startdate date)');
};

exports._meta = {
  'version': 1,
};
