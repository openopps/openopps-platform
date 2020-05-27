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
    DROP FUNCTION get_fsc_monthlysummary(startdate text, enddate text);
    CREATE OR REPLACE FUNCTION get_fsc_monthlysummary(startdate text, enddate text)
      RETURNS TABLE(calendar_year integer, calendar_month integer, cpdf_agency_code text, cpdf_agency_name text, cpdf_department_code text, cpdf_department_name text, cnt_opps_created integer, cnt_opps_submitted integer, cnt_opps_published integer, cnt_opps_assigned integer, cnt_opps_completed integer, cnt_intern_applications integer, cnt_opps_applications integer, cnt_opps_selections integer) 
      LANGUAGE 'plpgsql'
    AS $BODY$
    BEGIN
    
    -- drop table if it exists
    DROP TABLE IF EXISTS  fsc_dates;
    
    -- create new temp table
    CREATE TEMP TABLE
      fsc_dates
    AS SELECT to_char(CURRENT_DATE - (INTERVAL '1 Day' * (a."n" + (10 * b."n") + (100 * c."n") + (1000 * d."n"))), 'YYYY-MM-DD') AS thedate
    FROM (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS a 
    CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS b CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS c
    CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS d;
    
    -- Select date from other Functions
    RETURN QUERY
    SELECT  date_part('year', CAST(DT.thedate as Date))::integer as calendar_year,
      date_part('month', CAST(DT.thedate as Date))::integer as calendar_month,
      DT.cpdf_agency_code::text,
      DT.cpdf_agency_name::text,
      DT.cpdf_department_code::text,
      DT.cpdf_department_name::text,
      COALESCE(SUM(CO."cnt_opps_created"),0)::integer as cnt_opps_created,
      COALESCE(SUM(SO."cnt_opps_submitted"),0)::integer as cnt_opps_submitted,
      COALESCE(SUM(PO."cnt_opps_published"),0)::integer as cnt_opps_published,
      COALESCE(SUM(AO."cnt_opps_assigned"),0)::integer as cnt_opps_assigned,
      COALESCE(SUM(CMO."cnt_opps_completed"),0)::integer as cnt_opps_completed,
      COALESCE(SUM(APP."cnt_intern_applications"),0)::integer as cnt_intern_applications,
      COALESCE(SUM(VOL."cnt_opps_applications"),0)::integer as cnt_opps_applications,
      COALESCE(SUM(VOL."cnt_opps_selections"),0)::integer as cnt_opps_selections
    FROM (
      SELECT *
      FROM fsc_dates
      AS D 
      CROSS JOIN (
        SELECT *
        FROM get_cpdfagencyanddept()
      ) as O
      WHERE D.thedate between startdate and enddate
      and O.agency_id > 0
      --Order By D.thedate ASC
    ) as DT
    LEFT OUTER JOIN get_createdopps(startdate::date) as CO ON CO.created_date = DT.thedate AND CO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_submittedopps(startdate::date) as SO ON SO.submitted_date = DT.thedate AND SO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_publishedopps(startdate::date) as PO ON PO.published_date = DT.thedate AND PO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_assignedopps(startdate::date) as AO ON AO.assigned_date = DT.thedate AND AO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_completedopps(startdate::date) as CMO ON CMO.completed_date = DT.thedate AND CMO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_internshipapps(startdate::date) as APP ON APP.application_date = DT.thedate AND APP.agency_id = DT.agency_id
    LEFT OUTER JOIN get_appsbyagencyanddate(startdate::date) as VOL ON VOL.application_date = DT.thedate AND VOL.agency_id = DT.agency_id
    WHERE
      CO."cnt_opps_created" IS NOT NULL
      OR SO."cnt_opps_submitted" IS NOT NULL
      OR PO."cnt_opps_published" IS NOT NULL
      OR AO."cnt_opps_assigned" IS NOT NULL
      OR CMO."cnt_opps_completed" IS NOT NULL
      OR APP."cnt_intern_applications" IS NOT NULL
      OR VOL."cnt_opps_applications" IS NOT NULL
      OR VOL."cnt_opps_selections" IS NOT NULL
    GROUP BY date_part('year', CAST(DT.thedate as Date)),
      date_part('month', CAST(DT.thedate as Date)),
      DT.cpdf_agency_code,
        DT.cpdf_agency_name,
        DT.cpdf_department_code,
        DT.cpdf_department_name
    ORDER BY date_part('year', CAST(DT.thedate as Date)),
      date_part('month', CAST(DT.thedate as Date));
      
    END;
    $BODY$;
  `);
};

exports.down = function (db) {
  return db.runSql(`
    DROP FUNCTION get_fsc_monthlysummary(startdate text, enddate text);
    CREATE OR REPLACE FUNCTION get_fsc_monthlysummary(startdate text, enddate text)
      RETURNS TABLE(calendar_year integer, calendar_month integer, agency_code text, agency_name text, department_code text, department_name text, cnt_opps_created integer, cnt_opps_submitted integer, cnt_opps_published integer, cnt_opps_assigned integer, cnt_opps_completed integer, cnt_intern_applications integer, cnt_opps_applications integer, cnt_opps_selections integer) 
      LANGUAGE 'plpgsql'
    AS $BODY$
    BEGIN
    
    -- drop table if it exists
    DROP TABLE IF EXISTS  fsc_dates;
    
    -- create new temp table
    CREATE TEMP TABLE
      fsc_dates
    AS SELECT to_char(CURRENT_DATE - (INTERVAL '1 Day' * (a."n" + (10 * b."n") + (100 * c."n") + (1000 * d."n"))), 'YYYY-MM-DD') AS thedate
    FROM (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS a 
    CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS b CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS c
    CROSS JOIN (
      SELECT 0 AS n
      UNION ALL SELECT 1
      UNION ALL SELECT 2
      UNION ALL SELECT 3
      UNION ALL SELECT 4
      UNION ALL SELECT 5
      UNION ALL SELECT 6
      UNION ALL SELECT 7
      UNION ALL SELECT 8
      UNION ALL SELECT 9
    ) AS d;
    
    -- Select date from other Functions
    RETURN QUERY
    SELECT  date_part('year', CAST(DT.thedate as Date))::integer as calendar_year,
      date_part('month', CAST(DT.thedate as Date))::integer as calendar_month,
      DT.cpdf_agency_code::text,
      DT.cpdf_agency_name::text,
      DT.cpdf_department_code::text,
      DT.cpdf_department_name::text,
      COALESCE(SUM(CO."cnt_opps_created"),0)::integer as cnt_opps_created,
      COALESCE(SUM(SO."cnt_opps_submitted"),0)::integer as cnt_opps_submitted,
      COALESCE(SUM(PO."cnt_opps_published"),0)::integer as cnt_opps_published,
      COALESCE(SUM(AO."cnt_opps_assigned"),0)::integer as cnt_opps_assigned,
      COALESCE(SUM(CMO."cnt_opps_completed"),0)::integer as cnt_opps_completed,
      COALESCE(SUM(APP."cnt_intern_applications"),0)::integer as cnt_intern_applications,
      COALESCE(SUM(VOL."cnt_opps_applications"),0)::integer as cnt_opps_applications,
      COALESCE(SUM(VOL."cnt_opps_selections"),0)::integer as cnt_opps_selections
    FROM (
      SELECT *
      FROM fsc_dates
      AS D 
      CROSS JOIN (
        SELECT *
        FROM get_cpdfagencyanddept()
      ) as O
      WHERE D.thedate between startdate and enddate
      and O.agency_id > 0
      --Order By D.thedate ASC
    ) as DT
    LEFT OUTER JOIN get_createdopps(startdate::date) as CO ON CO.created_date = DT.thedate AND CO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_submittedopps(startdate::date) as SO ON SO.submitted_date = DT.thedate AND SO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_publishedopps(startdate::date) as PO ON PO.published_date = DT.thedate AND PO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_assignedopps(startdate::date) as AO ON AO.assigned_date = DT.thedate AND AO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_completedopps(startdate::date) as CMO ON CMO.completed_date = DT.thedate AND CMO.agency_id = DT.agency_id
    LEFT OUTER JOIN get_internshipapps(startdate::date) as APP ON APP.application_date = DT.thedate AND APP.agency_id = DT.agency_id
    LEFT OUTER JOIN get_appsbyagencyanddate(startdate::date) as VOL ON VOL.application_date = DT.thedate AND VOL.agency_id = DT.agency_id
    WHERE
      CO."cnt_opps_created" IS NOT NULL
      OR SO."cnt_opps_submitted" IS NOT NULL
      OR PO."cnt_opps_published" IS NOT NULL
      OR AO."cnt_opps_assigned" IS NOT NULL
      OR CMO."cnt_opps_completed" IS NOT NULL
      OR APP."cnt_intern_applications" IS NOT NULL
      OR VOL."cnt_opps_applications" IS NOT NULL
      OR VOL."cnt_opps_selections" IS NOT NULL
    GROUP BY date_part('year', CAST(DT.thedate as Date)),
      date_part('month', CAST(DT.thedate as Date)),
      DT.cpdf_agency_code,
        DT.cpdf_agency_name,
        DT.cpdf_department_code,
        DT.cpdf_department_name
    ORDER BY date_part('year', CAST(DT.thedate as Date)),
      date_part('month', CAST(DT.thedate as Date));
      
    END;
    $BODY$;
  `);
};

exports._meta = {
  'version': 1,
};
