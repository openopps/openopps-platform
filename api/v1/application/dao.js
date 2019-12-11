const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

dao.query.ApplicantSummary = `
  select
    midas_user.id as userId,
    midas_user.linked_id,
    midas_user.given_name,
    midas_user.last_name,
    task_list_application.date_last_contacted,	
    task_list_application.template_name,
    midas_user.username as email,
    (
      select json_agg(item)
      from (
        select 
          educationcode.value as "degree_level",
          education.major,
          education.school_name,
          education.city_name,
          cs.code as "country_subdivision",
          c.value as "country",
          education.completion_month,
          education.completion_year,
          education.gpa,
          education.gpa_max,
          education.total_credits_earned,
          education.credit_system,
          honorscode.value as "honors",
          education.course_work
        from 
          education
          inner join lookup_code as educationcode on education.degree_level_id = educationcode.lookup_code_id
          inner join lookup_code as honorscode on education.honors_id = honorscode.lookup_code_id
          inner join country_subdivision as cs on cs.country_subdivision_id = education.country_subdivision_id
          inner join country as c on c.country_id = education.country_id
        where application.application_id = education.application_id
        ) item
      ) as educations,
    (
        select json_agg(item order by sort_order)
        from (
          select coalesce(task.city_name || ', ' || country.value, 'Virtual') as loc,
            task.id,
            task.title,
            apps.sort_order
          from 
            application_task apps
            inner join task on apps.task_id = task.id
            left join country on task.country_id = country.country_id
          where 
            apps.application_id = application.application_id
            and apps.sort_order != -1
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
            inner join application_language_skill on "language".language_id = application_language_skill.language_id
            left outer join lookup_code reading on application_language_skill.reading_proficiency_id = reading.lookup_code_id
            left outer join lookup_code writing on application_language_skill.writing_proficiency_id = writing.lookup_code_id
            left outer join lookup_code speaking on application_language_skill.speaking_proficiency_id = speaking.lookup_code_id
          where "language".language_id = application_language_skill.language_id and application_language_skill.application_id = application.application_id
        ) item
      ) as languages,
      (
        select json_agg(item)
        from (
          select skilltag.name
          from application_skill
              inner join tagentity skilltag on application_skill.skill_id = skilltag.id
          where 
            type = 'skill'
            and application_skill.application_id = application.application_id
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
          select
            formal_title,
            employer_name,
            start_date,
            end_date,
            address_line_one,
            city_name,
            cs.code as "country_subdivision",
            c.code as "country",
            postal_code,
            duties
          from experience
            inner join country_subdivision cs on cs.country_subdivision_id = experience.country_subdivision_id
            inner join country c on c.country_id = experience.country_id
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
    task_list_application.application_id,
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
`;

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
