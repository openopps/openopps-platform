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
  db.runSql(`
    create or replace function get_task_total_score (p_cycle_id int8) 
    returns table (
    task_id int,
        title text,
        num_of_languages bigint,
        language_score int,
        num_of_applicants bigint,
        popularity_score numeric,
        random_factor numeric(30,29),
        total_score numeric
    ) 
    as $$
    begin
    return QUERY select 
        t.id as task_id,
        t.title,
        t.num_of_languages,
        t.language_score,
        t.num_of_applicants,
        t.popularity_score,
        t.random_factor,
        t.language_score + t.popularity_score + t.random_factor as total_score
      from (
        select 
          task.id, 
          task.title, 
          coalesce(lan.num_of_languages, 0) num_of_languages, 
          case when coalesce(lan.num_of_languages, 0) > 0
            then 10
            else 0
          end as language_score,
          coalesce(apps.num_of_applicants, 0) num_of_applicants, 
          ((0-((row_number() over (order by apps.num_of_applicants)) - tasks.task_count::numeric)) / (tasks.task_count::numeric - 1.0)) * 10.0 as popularity_score,
          task.random_factor
        from
          task
          left outer join (
            select language_skill.task_id, count(*) num_of_languages
            from language_skill
            group by language_skill.task_id
          ) lan on task.id = lan.task_id
          left outer join (
            select application_task.task_id, count(*) num_of_applicants
            from application_task
              inner join application on application_task.application_id = application.application_id
            where cycle_id = p_cycle_id
            group by application_task.task_id
          ) apps on task.id = apps.task_id
          cross join (
            select count(*) task_count
            from task
            where cycle_id = p_cycle_id
          ) tasks
        where
          cycle_id = p_cycle_id
      ) t
    order by total_score desc;
    end; $$ 
    
    language 'plpgsql';
  `, callback );
}

exports.down = function (db, callback) {
  db.runSql('drop function get_applicant_language_score(bigint)', callback);
}

exports._meta = {
 'version': 1,
};