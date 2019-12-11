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
    select count(*) applicant_count from application where submitted_at is not null and cycle_id = ?
`;

dao.query.isCommunityManager = `
    select is_manager
    from community_user
      inner join cycle on community_user.community_id = cycle.community_id
    where community_user.user_id = ? and cycle_id = ?
`;

dao.query.isJOACreated = `
    select secondary_application_url
    from cycle      
    where cycle_id = ?
`;

dao.query.getApplicationExistingCount = `
    select count(task_list_application.*) applicant_count
    from task_list_application
      inner join task_list on task_list_application.task_list_id = task_list.task_list_id
      inner join task on task_list.task_id = task.id
    where
      task.cycle_id = ?
`;

dao.query.getTaskApplicationCount = `
    select count(task_list_application.*) applicant_count
    from task_list_application
      inner join task_list on task_list_application.task_list_id = task_list.task_list_id
      inner join task on task_list.task_id = task.id
    where
      task.id = ?
`;

dao.query.getTaskIdAndListId = `
    select
      id as task_id,
      task_list_id as "reviewList",
      (
        select coalesce(max(sort_order), 0) max_sort_order
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
      task_list.task_id,
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

dao.query.RemoveApplicationsForPhase = `
  delete from task_list_application
  where task_list_id in (
    select task_list_id
    from task_list inner join task on task_list.task_id = task.id
    where 
      task.cycle_id = ?
      and task_list.title = 'For review'
  )
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
    (select count(*) from phase) as total_phases,
    (select is_manager from community_user where user_id = ? and community_id = c.community_id) as is_manager
  from
    "cycle" c
    left join phase p on p.phase_id = c.phase_id
  where
    c.cycle_id = ?
    and current_date between date(c.review_start_date) and date(c.review_end_date)
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
    mu.government_uri as email, 
    task.title, 
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id
    inner join task_share on task_share.user_id =  mu.id and task_share.task_id = task.id 
    where cycle.cycle_id = ?
`;

dao.query.getCommunityUsers = `
  select 
    mu.given_name,
    mu.government_uri as email,
    task.title,
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id
    inner join task_share on task_share.user_id =  mu.id and task_share.task_id = task.id 
    where cycle.cycle_id = ? and cu.is_manager = false
`;

dao.query.getCommunityManagers = `
  select 
    mu.given_name,
    mu.government_uri as email,
    task.title,
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id
    inner join task_share on task_share.user_id =  mu.id and task_share.task_id = task.id 
    where cycle.cycle_id = ? and cu.is_manager = true
`;

dao.query.getCommunityCreators = `
  select 
    mu.given_name,
    mu.government_uri as email,
    task.title,
    task.id as task_id
  from "cycle"
    inner join community on cycle.community_id = community.community_id
    inner join community_user cu on cu.community_id = community.community_id
    inner join midas_user mu on cu.user_id = mu.id
    inner join task on task.cycle_id = cycle.cycle_id and task."userId" = mu.id 
  where cycle.cycle_id = ?
`;

dao.query.getApplicantSelected = `
  select cycle.secondary_application_url as joblink, cycle.name as session, task.title,
    task.suggested_security_clearance, array_to_string(array[task.city_name, country_subdivision.value, country.value], ', ') as "location",
    mu.username as email, mu.given_name, array_to_string(array[b.name, o.name], '/') as bureau_office,
    mu2.username as contact_email, array_to_string(array[mu2.given_name, mu2.last_name], ' ') as contact_name
  from "cycle"
    inner join task on task.cycle_id = cycle.cycle_id
    inner join task_list tl on tl.task_id = task.id
    inner join task_list_application tla on tla.task_list_id = tl.task_list_id 
    inner join application a on a.application_id = tla.application_id
    inner join midas_user mu on mu.id = a.user_id
    inner join midas_user mu2 on mu2.id = task."userId"
    left join country on country.country_id = task.country_id
    left join country_subdivision on country_subdivision.country_subdivision_id = task.country_subdivision_id
    left join bureau b on b.bureau_id = task.bureau_id
    left join office o on o.office_id = task.office_id
  where cycle.cycle_id = ? and tl.title = 'Primary'
`;

dao.query.getApplicantAlternate = `
  select cycle.secondary_application_url as joblink, cycle.name as session, task.title,
    task.suggested_security_clearance, array_to_string(array[task.city_name, country_subdivision.value, country.value], ', ') as "location",
    mu.username as email, mu.given_name, array_to_string(array[b.name, o.name], '/') as bureau_office,
    mu2.username as contact_email, array_to_string(array[mu2.given_name, mu2.last_name], ' ') as contact_name
  from "cycle"
    inner join task on task.cycle_id = cycle.cycle_id
    inner join task_list tl on tl.task_id = task.id
    inner join task_list_application tla on tla.task_list_id = tl.task_list_id 
    inner join application a on a.application_id = tla.application_id
    inner join midas_user mu on mu.id = a.user_id
    inner join midas_user mu2 on mu2.id = task."userId"
    left join country on country.country_id = task.country_id
    left join country_subdivision on country_subdivision.country_subdivision_id = task.country_subdivision_id
    left join bureau b on b.bureau_id = task.bureau_id
    left join office o on o.office_id = task.office_id
  where cycle.cycle_id = ? and tl.title = 'Alternate'
`;

dao.query.getApplicantNotSelected = `
  select cycle.name as session, mu.username as email, mu.given_name    
    from "cycle"
      inner join application a on a.cycle_id = cycle.cycle_id
      inner join midas_user mu on mu.id = a.user_id    
    where cycle.cycle_id = ? and a.submitted_at is not null
      and a.application_id not in (select application_id from task_list_application)
`;

dao.query.GetCycleApplicantData = `
  select 
    midas_user.id as "applicant_id",
    application.application_id,
    midas_user.given_name,
    midas_user.last_name,
    midas_user.username as "applicant_email",
    task_owner."name" as "opportunity_creator_name",
    task_owner."username" as "opportunity_creator_email",
    case when pri.task_id is not null then task.title end as "primary",
    case when alt.task_id is not null then task.title end as "alternate",
    board.date_last_contacted,
    bureau."name" as "bureau",
    office."name" as "office/post",
    task.suggested_security_clearance as "security_clearance_level",
    board.task_id as "board_id",
    case when application_task.sort_order = -1 then null else application_task.sort_order end as "board_preference"
  from midas_user
    inner join application on midas_user.id = application.user_id
    inner join application_task on application.application_id = application_task.application_id
    inner join task on application_task.task_id = task.id
    left join midas_user task_owner on task."userId" = task_owner.id
    left join bureau on task.bureau_id = bureau.bureau_id
    left join office on task.office_id = office.office_id
    left join lateral (
      select *
            from task_list
                    inner join task_list_application on task_list.task_list_id = task_list_application.task_list_id and task_list_application.application_id = application.application_id
            where task.id = task_list.task_id and task_list.title = 'Primary'
    ) as pri on true
    left join lateral (
        select *
              from task_list
                      inner join task_list_application on task_list.task_list_id = task_list_application.task_list_id and task_list_application.application_id = application.application_id
              where task.id = task_list.task_id and task_list.title = 'Alternate'
    ) as alt on true
    left join lateral (
        select *
              from task_list
                      inner join task_list_application on task_list.task_list_id = task_list_application.task_list_id and task_list_application.application_id = application.application_id
              where task.id = task_list.task_id
                and task_list.title in ('Alternate', 'Primary')
    ) as board on true
  where task.cycle_id = ?
    and application.submitted_at is not null
`;

module.exports = function (db) {
  dao.Application = pgdao({ db: db, table: 'application' });
  dao.ApplicationTask = pgdao({ db: db, table: 'application_task' });
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
