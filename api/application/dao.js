const _ = require('lodash');
const dao = require('postgres-gen-dao');

const applicationQuery = 'SELECT @application.*, @securityClearance.* ' +
  'FROM @application application ' +
  'LEFT JOIN @lookup_code securityClearance on "securityClearance".lookup_code_id = application.security_clearance_id ' +
  'WHERE application.application_id = ?';

const applicationTasksQuery = 'SELECT ' +
  'application_task.application_task_id AS "applicationTaskId", application_task.application_id AS "applicationId", ' +
  'application_task.task_id AS "taskId", application_task.sort_order AS "sortOrder",' +
  '(case when application_task.task_id in (select  task_list.task_id as "taskId" from task_list_application '+
'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' +
'inner join application on task_list_application.application_id = application.application_id ' +
'JOIN task ON task.id = task_list.task_id )and (task."state"<>\'completed\' or task."state" is null) and task_list.title=\'Primary\' then ' +
'\'Primary select\' ' +

 'when application_task.task_id in (select  task_list.task_id as "taskId" from task_list_application ' + 
'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' + 
'inner join application on task_list_application.application_id = application.application_id ' +
'JOIN task ON task.id = task_list.task_id )and (task."state" <> \'completed\' or task."state" is null) and task_list.title=\'Alternate\' then ' +
'\'Alternate Select\' ' +

 'when application_task.task_id in (select  task_list.task_id as "taskId" from task_list_application ' +
'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' + 
'inner join application on task_list_application.application_id = application.application_id ' + 
'JOIN task ON task.id = task_list.task_id ) and (task."state"=\'completed\' ) and app.internship_completed_at is not null then ' +
 '\'Completed\' ' +

 'when application_task.task_id in (select  task_list.task_id as "taskId" from task_list_application ' +
'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' + 
'inner join application on task_list_application.application_id = application.application_id ' +
'JOIN task ON task.id = task_list.task_id )and (task."state"= \'completed\' ) and app.internship_completed_at is null and task_list.title=\'Primary\' then ' +
'\'Not completed\' ' +


'when application_task.task_id in (select  task_list.task_id as "taskId" from task_list_application ' + 
'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' + 
'inner join application on task_list_application.application_id = application.application_id ' +
'JOIN task ON task.id = task_list.task_id )and (task."state" = \'completed\') and app.internship_completed_at is null and task_list.title=\'Alternate\' then ' +
'\'Alternate Select\' ' +

'ELSE \'Not selected\' ' +
'end) as "status", ' +
  'application_task.updated_at AS "updatedAt", ' +
  'task.title, bureau.name AS bureau, office.name AS office ' +
  'FROM application_task ' +
  'join application app on app.application_id= application_task.application_id ' +
  'JOIN task ON task.id = application_task.task_id ' +
  'left join task_list_application on application_task.application_id = task_list_application.application_id ' +
  'left join task_list on task_list_application.task_list_id = task_list.task_list_id ' +
  'LEFT JOIN bureau ON bureau.bureau_id = task.bureau_id ' +
  'LEFT JOIN office ON office.office_id = task.office_id ' + 
  'WHERE application_task.application_id = ? and application_task.sort_order <> -1';

const applicationEducationQuery = 'SELECT @education.*, @degreeLevel.*,@honor.*, @country.*, @countrySubdivision.* ' +
  'FROM @education education ' +
  'JOIN @lookup_code degreeLevel on "degreeLevel".lookup_code_id = education.degree_level_id ' + 
  'LEFT JOIN @lookup_code honor on "honor".lookup_code_id = education.honors_id ' + 
  'JOIN @country country on country.country_id = education.country_id ' +
  'LEFT JOIN @country_subdivision countrySubdivision on "countrySubdivision".country_subdivision_id = education.country_subdivision_id ' +
  'WHERE education.application_id = ? ' + 'order by education.education_id ';

const applicationExperienceQuery = 'SELECT @experience.*, @country.*, @countrySubdivision.* ' +
  'FROM @experience experience ' +
  'JOIN @country country on country.country_id = experience.country_id ' +
  'LEFT JOIN @country_subdivision countrySubdivision on "countrySubdivision".country_subdivision_id = experience.country_subdivision_id ' +
  'WHERE experience.application_id = ? ';

const applicationLanguageQuery = 'SELECT @language.*, @details.*, @speakingProficiency.*, @readingProficiency.*, @writingProficiency.* ' +
  'FROM @application_language_skill language ' +
  'JOIN @lookup_code speakingProficiency on "speakingProficiency".lookup_code_id = language.speaking_proficiency_id ' +
  'JOIN @lookup_code readingProficiency on "readingProficiency".lookup_code_id = language.reading_proficiency_id ' +
  'JOIN @lookup_code writingProficiency on "writingProficiency".lookup_code_id = language.writing_proficiency_id ' +
  'LEFT JOIN @language details on language.language_id = details.language_id ' +
  'WHERE language.application_id = ?';

const applicationReferenceQuery = 'SELECT @reference.*, @referenceType.* ' +
  'FROM @reference reference ' +
  'JOIN @lookup_code referenceType on "referenceType".lookup_code_id = reference.reference_type_id ' +
  'WHERE reference.application_id = ?';

const applicationSkillQuery = 'SELECT tags.* ' +
  'FROM tagentity AS tags ' +
  'JOIN application_skill AS skill on tags.id = skill.skill_id ' +
  'WHERE skill.application_id = ?';

const countryQuery= 'SELECT country.country_id as "id", country.country_id as "countryId",country.code,country.value ' +
  'from country ' + 'join education on country.country_id = education.country_id ' + 
  'where education.education_id = ? ';

const profileSkillsQuery = `SELECT tags.* 
  from tagentity tags
  inner join tagentity_users__user_tags user_tags on tags.id = user_tags.tagentity_users
  where tags.type = 'skill' and user_tags.user_tags = ?`;  

const securityClearanceQuery = 'SELECT application.security_clearance_id, lookup_code.value ' +
  'FROM application join lookup_code on application.security_clearance_id = lookup_code.lookup_code_id ' +
  'WHERE application.application_id = ?';

const submittedApplicationCycleQuery = 'SELECT cycle.* ' +
'FROM cycle ' +
'JOIN application on cycle.cycle_id = application.cycle_id ' +
'WHERE application.application_id = ?';

const submittedApplicationCommunityQuery = 'SELECT community.community_name ' +
'FROM community ' +
'JOIN application on community.community_id = application.community_id ' +
'WHERE application.application_id = ?';

const selectedApplicantQuery =    'select cycle.secondary_application_url as joblink, cycle.closed_date as "closedDate", cycle.name as session, task.title, ' +
'task.suggested_security_clearance, array_to_string(array[task.city_name, country_subdivision.value, country.value],  \', \') as "location", ' +
'mu.username as email, mu.given_name, array_to_string(array[b.name, o.name],\'/\') as bureau_office, ' +
'mu2.username as contact_email, array_to_string(array[mu2.given_name, mu2.last_name], \' \') as contact_name, ' +
'cycle.exclusive_posting_end_date ' +
'from "cycle" ' +
'inner join task on task.cycle_id = cycle.cycle_id ' +
'inner join task_list tl on tl.task_id = task.id ' +
'inner join task_list_application tla on tla.task_list_id = tl.task_list_id ' +
'inner join application a on a.application_id = tla.application_id ' +
'inner join midas_user mu on mu.id = a.user_id ' +
'inner join midas_user mu2 on mu2.id = task."userId" ' +
'left join country on country.country_id = task.country_id ' +
'left join country_subdivision on country_subdivision.country_subdivision_id = task.country_subdivision_id ' +
'left join bureau b on b.bureau_id = task.bureau_id ' +
'left join office o on o.office_id = task.office_id ' +
'where  tl.title = \'Primary\' and a.application_id = ?' ;

const  alternateApplicantQuery=   'select cycle.secondary_application_url as joblink, cycle.name as session, cycle.closed_date as "closedDate", task.title, ' +
'task.suggested_security_clearance, array_to_string(array[task.city_name, country_subdivision.value, country.value], \', \') as "location", ' +
'mu.username as email, mu.given_name, array_to_string(array[b.name, o.name], \'/\') as bureau_office,' +
'mu2.username as contact_email, array_to_string(array[mu2.given_name, mu2.last_name], \' \') as contact_name, ' +
'cycle.exclusive_posting_end_date ' +
'from "cycle" ' +
'inner join task on task.cycle_id = cycle.cycle_id ' +
'inner join task_list tl on tl.task_id = task.id ' +
'inner join task_list_application tla on tla.task_list_id = tl.task_list_id ' +
'inner join application a on a.application_id = tla.application_id ' +
'inner join midas_user mu on mu.id = a.user_id ' +
'inner join midas_user mu2 on mu2.id = task."userId" ' +
'left join country on country.country_id = task.country_id ' +
'left join country_subdivision on country_subdivision.country_subdivision_id = task.country_subdivision_id ' +
'left join bureau b on b.bureau_id = task.bureau_id ' +
'left join office o on o.office_id = task.office_id ' +
'where  tl.title = \'Alternate\' and a.application_id = ?';

const notSelectedApplicantQuery = 'select cycle.name as session, mu.username as email,cycle.closed_date as "closedDate", mu.given_name ' +   
'from "cycle" ' +
  'inner join application a on a.cycle_id = cycle.cycle_id ' +
  'inner join midas_user mu on mu.id = a.user_id ' +
  'left join task_list_application tla on tla.application_id = a.application_id ' +
  'left join task_list tl on tl.task_list_id = tla.task_list_id ' +
 'where a.application_id = ? and a.submitted_at is not null ' +
  'and (tl.title is null or tl.title not in (\'Primary\',\'Alternate\'))';

const applicantCountQuery = 
    'select count(*) applicant_count from application where submitted_at is not null and cycle_id = ?';

const selectedInternshipQuery = 'select ' +
   'task_list.title, task_list.task_id as "taskId", task.title as "taskTitle", ' +
   'task_list_application.application_id as "applicationId", ' +	
   'bureau.name AS bureau, office.name AS office, c.closed_date, ' +
   '(case ' +
    'when (task."state"<>\'completed\' or task."state" is null) and task_list.title=\'Primary\' then \'Primary select\' ' + 
    'when (task."state"<>\'completed\' or task."state" is null) and task_list.title=\'Alternate\' then \'Alternate select\' ' +
     'when task."state"=\'completed\' and application.internship_completed_at is not null then \'Completed\' ' +
    'when task."state"=\'completed\' and application.internship_completed_at is null and task_list.title =\'Primary\' then \'Not completed\' ' +
    'when  task."state"=\'completed\'  and task_list.title=\'Alternate\' and application.internship_completed_at is null then \'Alternate select\' ' +
    'end ' +                            
    ') as "status" ' +
   'from task_list_application ' +
   'inner join task_list on task_list_application.task_list_id = task_list.task_list_id ' +
  'inner join application on task_list_application.application_id = application.application_id ' +
  'JOIN task ON task.id = task_list.task_id ' +
  'join cycle c on application.cycle_id = c.cycle_id ' +
  'LEFT JOIN bureau ON bureau.bureau_id = task.bureau_id ' +
  'LEFT JOIN office ON office.office_id = task.office_id ' +
  'where task_list.title in (\'Primary\', \'Alternate\') and ' +
  'task_list.task_id not in (select task_id from application_task where application_task.application_id = ?) ' + 
  'and task_list_application.application_id = ? ';

  


module.exports = function (db) {
  return {
    Application: dao({ db: db, table: 'application' }),
    ApplicationLanguageSkill: dao({ db: db, table: 'application_language_skill' }),
    ApplicationSkill: dao({ db:db, table:'application_skill' }),
    ApplicationTask: dao({ db: db, table: 'application_task' }),
    AuditLog:dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityEmailTemplate: dao({ db: db, table: 'community_email_template' }),
    Country: dao({ db: db, table: 'country' }),
    CountrySubdivision: dao({ db: db, table: 'country_subdivision' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    Education: dao({ db: db, table: 'education' }),
    ErrorLog: dao({ db: db, table: 'error_log' }),
    Experience: dao({ db: db, table: 'experience' }),
    Language: dao({ db: db, table: 'language' }),
    LookUpCode: dao({ db: db, table: 'lookup_code' }),
    Reference: dao({ db:db, table:'reference'}),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    Task: dao({ db: db, table: 'task' }),
    User: dao({ db: db, table: 'midas_user' }),

    query: {
      application: applicationQuery,
      applicationTasks: applicationTasksQuery,
      applicationEducation: applicationEducationQuery,
      applicationExperience: applicationExperienceQuery,
      applicationLanguage: applicationLanguageQuery,
      applicationReference: applicationReferenceQuery,
      applicationSkill: applicationSkillQuery,
      country: countryQuery,
      profileSkills: profileSkillsQuery,
      securityClearance: securityClearanceQuery,
      submittedApplicationCycle: submittedApplicationCycleQuery,
      submittedApplicationCommunity: submittedApplicationCommunityQuery,
      selectedApplicant: selectedApplicantQuery,
      alternateApplicant: alternateApplicantQuery,
      notSelectedApplicant: notSelectedApplicantQuery,
      applicantCount:applicantCountQuery,
      selectedInternship: selectedInternshipQuery,
     
    },
  };
};
