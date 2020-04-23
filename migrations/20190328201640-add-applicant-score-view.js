'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
 exports.up = function (db, callback) {
  db.runSql(`
      create or replace function get_applicant_score (p_cycle_id int8) 
      returns table (
      task_id int4,
      application_id int8,
      preference int4,
      cumulative_gpa numeric,
      random_factor numeric,
      random_weight float4,
      weighted_random_factor float8,
      weighted_gpa numeric
      ) 
      as $$
      begin
      return QUERY select
            t.id as task_id,
            app.application_id,
            appt.sort_order as preference,
            app.cumulative_gpa,
            app.random_factor,
            t.random_weight,
            app.random_factor * t.random_weight as weighted_random_factor,
            case
              when gpa_range.max_gpa - gpa_range.min_gpa = 0 then 0
              else ((app.cumulative_gpa - gpa_range.min_gpa) / (gpa_range.max_gpa - gpa_range.min_gpa)) * 10.0
            end as weighted_gpa
          from
            application app
            inner join task t on app.cycle_id = t.cycle_id and app.community_id = t.community_id
            left outer join application_task appt on app.application_id = appt.application_id and appt.task_id = t.id
            inner join (
              select max(application.cumulative_gpa) max_gpa, min(application.cumulative_gpa) min_gpa, community_id, cycle_id
              from application
              group by community_id, cycle_id
            ) gpa_range on app.community_id = gpa_range.community_id and app.cycle_id = gpa_range.cycle_id
      where
        t.cycle_id = p_cycle_id;
      end; $$ 
      
      language 'plpgsql';
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop function get_applicant_score(bigint)', callback);
}

exports._meta = {
 'version': 1,
};