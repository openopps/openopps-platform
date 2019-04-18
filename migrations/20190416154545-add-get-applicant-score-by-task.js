'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function (db, callback) {
  db.runSql('drop function get_task_total_score(bigint)', callback);
  db.runSql(`
    create or replace function get_applicant_score_by_task (p_task_id int8) 
    returns table (
      task_id int4,
      application_id int8,
      preference int4,
      cumulative_gpa numeric,
      random_factor numeric,
      random_weight float4,
      weighted_random_factor float8,
      weighted_gpa numeric,
      reading_score numeric,
      writing_score numeric,
      speaking_score numeric,
      language_score numeric,
      weighted_language_score float8,
      total_score float8
    ) 
    as $$
    begin
    return QUERY
      select 
        t2.task_id,
        t2.application_id,
        t2.preference,
        t2.cumulative_gpa,
        t2.random_factor,
        t2.random_weight,
        t2.weighted_random_factor,
        t2.weighted_gpa,
        t2.reading_score,
        t2.writing_score,
        t2.speaking_score,
        t2.language_score,
        t2.weighted_language_score,
        (t2.weighted_random_factor + t2.weighted_gpa + t2.weighted_language_score) as total_score
      from 
        (
          select
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
          end as weighted_gpa,
          coalesce(lang.reading_score, 0) as reading_score,
          coalesce(lang.writing_score, 0) as writing_score,
          coalesce(lang.speaking_score, 0) as speaking_score,
          coalesce(lang.language_score, 0) as language_score,
          coalesce(lang.weighted_language_score, 0) as weighted_language_score
        from
          application app
          cross join (
            select * from task where id = p_task_id
          ) t
          left outer join application_task appt on app.application_id = appt.application_id and appt.task_id = t.id
          inner join (
            select max(application.cumulative_gpa) max_gpa, min(application.cumulative_gpa) min_gpa, community_id, cycle_id
            from application
            group by community_id, cycle_id
          ) gpa_range on app.community_id = gpa_range.community_id and app.cycle_id = gpa_range.cycle_id	
          left outer join get_applicant_language_score_by_task(p_task_id) lang on lang.application_id = app.application_id
        where
          not exists(
            select 1 
            from task_list_application 
            where task_list_application.application_id = app.application_id
        )
      ) t2
      order by total_score desc;
      end; $$ 
          
      language 'plpgsql';
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop function get_applicant_score_by_task(bigint)', callback);
}

exports._meta = {
 'version': 1,
};