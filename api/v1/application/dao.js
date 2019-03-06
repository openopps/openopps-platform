const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

dao.query.ApplicantSummary = `
  select
    midas_user.id as userId,
    midas_user.given_name,
    midas_user.last_name,
    task_list_application.date_last_contacted,	
    midas_user.username as email,
    (
      select json_agg(item)
      from (
        select 
          educationcode.value as "degree_level",
          education.major,
          education.school_name
        from 
          education
          inner join lookup_code as educationcode on education.degree_level_id = educationcode.lookup_code_id
        where application.application_id = education.application_id
        ) item
      ) as educations,
    (
        select json_agg(item)
        from (
        select 
        (
          select tag.name
          from tagentity_tasks__task_tags tags
            inner join tagentity tag on tags.tagentity_tasks = tag.id 
          where task_tags = task.id and type = 'location'
          limit 1
        ) loc,
        task.id,
        task.title
      from 
        application_task apps
        inner join task on apps.task_id = task.id
      where apps.application_id = application.application_id
        ) item
      ) as "desiredOpportunities",
      application.cumulative_gpa as gpa,
      (
        select json_agg(item)
        from (
          select 
            "language".value,
            reading.value as reading_value,
            writing.value as writing_value,
            speaking.value as speaking_value
          from "language"    
            inner join language_skill on "language".language_id = language_skill.language_id
            left outer join lookup_code reading on language_skill.reading_proficiency_id = reading.lookup_code_id
            left outer join lookup_code writing on language_skill.writing_proficiency_id = writing.lookup_code_id
            left outer join lookup_code speaking on language_skill.speaking_proficiency_id = speaking.lookup_code_id
          where "language".language_id = language_skill.language_id and language_skill.application_id = application.application_id
        ) item
      ) as languages,
      application.cumulative_gpa as gpa,
      (
        select json_agg(item)
        from (
          select skilltag.name
          from tagentity skilltag
            inner join tagentity_users__user_tags tags on skilltag.id = tags.tagentity_users
          where 
            type = 'skill'
            and user_tags = application.user_id
        ) item
      ) as skills,
    -- overseas experience
    (
        select json_agg(item)
        from (
          select lookup_code.value, security_clearance_issuer
          from application app
            inner join lookup_code on app.security_clearance_id = lookup_code.lookup_code_id
          where app.application_id = application.application_id
        ) item
      ) as "securityClearance",
    -- prior vsfs experience
    (
        select json_agg(item)
        from (
          select 
            reference_name, 
            reference_employer, 
            reference_title, 
            reference_email, 
            reference_phone, 
            is_reference_contact, 
            lookup_code.value
          from reference
            inner join lookup_code on reference.reference_type_id = lookup_code.lookup_code_id
          where reference.application_id = application.application_id
        ) item
      ) as "references",
    (
        select json_agg(item)
        from (
          select formal_title, employer_name, start_date, end_date
          from experience
          where application_id = application.application_id
        ) item
      ) as experience,
    statement_of_interest,
    task_list_application.sort_order,
    task_list.task_list_id
    from
      task_list_application
      inner join task_list on task_list_application.task_list_id = task_list.task_list_id
      inner join application on task_list_application.application_id = application.application_id
      inner join midas_user on application.user_id = midas_user.id
    where
      application.application_id = ?
`

module.exports = function (db) {
    dao.Application = pgdao({ db: db, table: 'application' }),
    dao.User = pgdao({ db: db, table: 'midas_user' });
    dao.TaskList = pgdao({ db: db, table: 'task_list' });
    dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
    return dao;
  };