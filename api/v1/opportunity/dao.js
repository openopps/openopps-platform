const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

dao.query.internshipListQuery = `
  select 
    task.id, 
    "cycle".name as "Cycle", 
    task.title as "Title", 
    task.interns as "NumberOfPositions",
    task.city_name as "City",
    country.value as "Country",
    (select count(*) from application_task where application_task."task_id" = task.id) as "ApplicantCount"
  from 
    task 
    inner join "cycle" on task."cycle_id" = "cycle"."cycle_id"
    inner join community on task.community_id = community.community_id
    inner join task_share on task.id = task_share."task_id"
    left outer join country on task."country_id" = country."country_id"
  where
    task_share.user_id = ?
    and state = ?
`;

dao.query.internshipSummaryQuery = `
  select 
    task.id, 
    "cycle".name as "cycleName", 
    task.title as "taskTitle", 
    task.interns as "numberOfSeats"
  from 
    task 
    inner join "cycle" on task."cycle_id" = "cycle"."cycle_id"
    inner join community on task.community_id = community.community_id
    inner join task_share on task.id = task_share."task_id"
  where   
    task_share."user_id" = ?
    and task.id = ?
`;

dao.query.taskShareQuery = `
  select
    left(given_name, 1) || left(last_name, 1) as initials,
    given_name,
    last_name,
    government_uri,
    user_id,
    shared_by_user_id,
    last_modified
  from 
    task_share
    inner join midas_user on task_share.user_id = midas_user."id"
  where 
    task_share.user_id <> ?
    and task_id = ?
`;

dao.query.taskListQuery = `
  select
    task_list_id,
    task_id,
    title,
    sort_order
  from
    task_list
  where task_id = ?
  order by sort_order
`;

dao.query.applicationsNotInListQuery = `
  select application_id
  from application_task
  where task_id = ?
  except
  select application_id
  from 
    task_list_application 
    inner join task_list on task_list_application.task_list_id = task_list.task_list_id
  where task_id = ?
`;

dao.query.taskListApplicationQuery = `
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
      select json_agg(item)
      from (
      select 
        educationcode.value as "degree_level",
        education.major
      from 
        education
        inner join lookup_code as educationcode on education.degree_level_id = educationcode.lookup_code_id
      where application.application_id = education.application_id
      ) item
    ) as educations,
    application.cumulative_gpa as gpa,
    (
      select json_agg(item)
      from (
      select "language".value
      from "language"    
        inner join language_skill on "language".language_id = language_skill.language_id
      where "language".language_id = language_skill.language_id and language_skill.application_id = application.application_id
      ) item
    ) as languages,
    application.cumulative_gpa as gpa,
    (
      select json_agg(item)
      from (
      select locationtag.name
      from tagentity locationtag
        inner join tagentity_users__user_tags tags on locationtag.id = tags.tagentity_users
      where 
        type = 'location'
        and user_tags = application.user_id
      ) item
    ) as locations,
    '2/28/2019' as "lastContacted"
  from
    task_list_application
    inner join task_list on task_list_application.task_list_id = task_list.task_list_id
    inner join application on task_list_application.application_id = application.application_id
    inner join midas_user on application.user_id = midas_user.id
  where
    task_list.task_list_id = ?
`;

module.exports = function (db) {
  dao.Task = pgdao({ db: db, table: 'task' }),
  dao.TaskShare = pgdao({ db: db, table: 'task_share' });
  dao.TaskList = pgdao({ db: db, table: 'task_list' });
  dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
  return dao;
};
