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
          education.school_name,
          education.completion_month,
          education.completion_year
        from 
          education
          inner join lookup_code as educationcode on education.degree_level_id = educationcode.lookup_code_id
        where application.application_id = education.application_id
        ) item
      ) as educations,
    (
        select json_agg(item)
        from (
        select coalesce(task.city_name || ', ' || country.value, 'Virtual') as loc,
        task.id,
        task.title
      from 
        application_task apps
        inner join task on apps.task_id = task.id
        left join country on task.country_id = country.country_id
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
    (
        select json_agg(item)
        from (
          select lookup_code.value, security_clearance_issuer
          from application app
            inner join lookup_code on app.security_clearance_id = lookup_code.lookup_code_id
          where app.application_id = application.application_id
        ) item
      ) as "securityClearance",
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
    task_list.task_list_id, 
    (
      select application_task.application_task_id
      from
        application_task
      where
        application_task.application_id = application.application_id
        and application_task.task_id = task_list.task_id
    ),
    task_list_application.task_list_application_id,
    task_list.sort_order task_list_sort_order,
    task_list.task_id,
    application.has_vsfs_experience,
    application.has_overseas_experience,
    application.overseas_experience_other,
    application.overseas_experience_length,
    application.overseas_experience_types,
    application.transcript_id,
    application.transcript_name
    from
      task_list_application
      inner join task_list on task_list_application.task_list_id = task_list.task_list_id
      inner join application on task_list_application.application_id = application.application_id
      inner join midas_user on application.user_id = midas_user.id
    where
    task_list_application.task_list_application_id = ?
`
module.exports = function (db) {
    dao.Application = pgdao({ db: db, table: 'application' }),
    dao.User = pgdao({ db: db, table: 'midas_user' });
    dao.TaskList = pgdao({ db: db, table: 'task_list' });
    dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
    dao.TaskListApplicationHistory = pgdao({ db: db, table: 'task_list_application_history' });
    dao.ApplicationTask = pgdao({ db: db, table: 'application_task' });
    dao.pgdao = pgdao;
    return dao;
};
