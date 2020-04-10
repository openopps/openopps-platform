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
    CREATE OR REPLACE FUNCTION get_cpdfagencyanddept()
      RETURNS TABLE(agency_id integer, cpdf_agency_code character varying, cpdf_agency_name character varying, cpdf_department_code character varying, cpdf_department_name character varying) 
      LANGUAGE 'plpgsql'
    AS $BODY$ BEGIN
      RETURN QUERY SELECT
        0 as agency_id,
        '00' as cpdf_agency_code,
        'No Agency Selected' as cpdf_agency_name,
        '0' as cpdf_department_code,
        'No Department Selected' as cpdf_department_name
      UNION ALL
      SELECT
        a."agency_id",
        a."code" as cpdf_agency_code,
        a."name" as cpdf_agency_name,
        d."code" as cpdf_department_code,
        d."name" as cpdf_department_name
      FROM agency as a
      INNER JOIN agency as d
        ON A."parent_code" = d."code"
      WHERE a."code" IS NOT NULL;
    END; $BODY$
  `);
};

exports.down = function (db) {
  return db.runSql('DROP FUNCTION IF EXISTS get_cpdfagencyanddept()');
};

exports._meta = {
  'version': 1,
};
