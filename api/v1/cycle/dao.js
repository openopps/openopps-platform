const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

dao.query.getTaskTotalScore = `
    select * from get_task_total_score(?)
`;

dao.query.getTopApplicantScoreByTaskWithPreference = `
    select * from get_applicant_score_by_task(?) where preference is not null limit 1
`;

dao.query.getTopApplicantScoreByTask = `
    select * from get_applicant_score_by_task(?) limit 1
`;

dao.query.getApplicationCount = `
    select count(*) applicant_count from application where cycle_id = ?
`;

dao.query.getTaskIdAndListId = `
    select
      id as task_id,
      task_list_id as "reviewList",
      (
        select max(sort_order) max_sort_order
        from task_list_application
        where task_list_application.task_list_id = task_list.task_list_id
      ) as max_sort
    from task 
      inner join task_list on task.id = task_list.task_id
    where task.id = ?
      and sort_order = 0
`;

dao.query.getOneIntern = `
    select
      task_list_application_id,
      task_list_application.task_list_id,
      task_list_application.application_id,
      task_list_application.sort_order,
      task_list_application.date_last_contacted,
      midas_user.given_name,
      midas_user.last_name,
      midas_user.username as email,
      (
        select application_task.sort_order as choice
        from
          application_task
        where
          application_task.application_id = application.application_id
          and application_task.task_id = task_list.task_id
      ),
      (
        select json_build_object(
          'degree_level', educationcode.value,
          'major', education.major
        ) as education
        from 
          education
          inner join lookup_code as educationcode on education.degree_level_id = educationcode.lookup_code_id
        where application.application_id = education.application_id
        order by education.major
        limit 1
      ),
      application.cumulative_gpa as gpa,
      (
        select json_agg(item)
        from (
        select "language".value
        from "language"    
          inner join application_language_skill on "language".language_id = application_language_skill.language_id
        where "language".language_id = application_language_skill.language_id and application_language_skill.application_id = application.application_id
        limit 3
        ) item
      ) as languages
    from
      task_list_application
      inner join task_list on task_list_application.task_list_id = task_list.task_list_id
      inner join application on task_list_application.application_id = application.application_id
      inner join midas_user on application.user_id = midas_user.id
    where
      application.application_id = ?
    order by sort_order
`;

dao.query.taskListQuery = `
  select
    task_list_id
  from
    task_list
  where task_id = ? and sort_order = 0
`;

dao.query.GetPhaseData = `
  select
    c."name" as cycle_name,
    c.cycle_id,
    case when c.is_processing then coalesce(p."sequence", 0) + 1 else coalesce(p."sequence", 0) end as current_sequence,
    c.is_processing,
    case when c.is_processing and coalesce(p."sequence", 0) < 1 then true
      when coalesce(p."sequence", 0) < 1 then false
      else true end as phases_started,
    (select count(*) from phase) as total_phases
  from
    "cycle" c
    left join phase p on p.phase_id = c.phase_id
  where
    c.cycle_id = ?
    and now() between c.review_start_date and c.review_end_date
`;

dao.query.GetPhases = `
  select
    phase_id,
    "name",
    description,
    "sequence",
    config
  from
    phase
  where
    "sequence" between ? and ?
  order by
    "sequence"
`;

dao.query.getAllCommunityUsers = `
  select 
    mu.given_name, 
    mu.username as email, 
    task.title, 
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id
    where cycle.cycle_id = ?
`;

dao.query.getCommunityUsers = `
  select 
    mu.given_name,
    mu.username as email,
    task.title,
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id
    where cycle.cycle_id = ? and cu.is_manager = false
`;

module.exports = function (db) {
  dao.Application = pgdao({ db: db, table: 'application' });
  dao.Task = pgdao({ db: db, table: 'task' });
  dao.TaskList = pgdao({ db: db, table: 'task_list' });
  dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
  dao.TaskListApplicationHistory = pgdao({ db: db, table: 'task_list_application_history' });
  dao.Cycle = pgdao({ db: db, table: 'cycle' });
  dao.Community = pgdao({ db: db, table: 'community' });
  dao.Community_User = pgdao({ db: db, table: 'community_user' });
  dao.Midas_User = pgdao({ db: db, table: 'midas_user' });
  dao.Phase = pgdao({ db: db, table: 'phase' });
  dao.AuditLog = pgdao({ db: db, table: 'audit_log' });
  dao.ErrorLog = pgdao({ db: db, table: 'error_log' });
  return dao;
};