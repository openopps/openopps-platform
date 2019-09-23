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
  db.runSql('drop function get_task_total_score(bigint)', (err) => {
    db.runSql(`
    create or replace function get_task_total_score (p_cycle_id int8) 
    returns table (
        task_id integer, 
        title text, 
        num_of_languages bigint, 
        language_score integer, 
        num_of_applicants bigint, 
        popularity_score numeric, 
        random_factor numeric, 
        total_score numeric, 
        interns integer, 
        alternate_rate integer, 
        preferred_languages integer[]
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
        t.language_score + t.popularity_score + t.random_factor as total_score,
        t.interns,
        t.alternate_rate,
        (select array_agg(language_id) from language_skill where language_skill.task_id = t.id)
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
          task.random_factor,
          task.interns,
          1 as alternate_rate
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
          and task.state = 'open'
      ) t
    order by total_score desc;
    end; $$ 
    
    language 'plpgsql';
  `, callback );
  });
}

exports.down = function (db, callback) {
  db.runSql('drop function get_task_total_score(bigint)', callback);
}

exports._meta = {
 'version': 1,
};
