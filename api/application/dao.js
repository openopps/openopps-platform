const _ = require('lodash');
const dao = require('postgres-gen-dao');

const applicationQuery = 'SELECT @application.*, @securityClearance.* ' +
  'FROM @application application ' +
  'LEFT JOIN @lookup_code securityClearance on "securityClearance".lookup_code_id = application.security_clearance_id ' +
  'WHERE application.application_id = ?';

const applicationTasksQuery = 'SELECT ' +
  'application_task.application_task_id AS "applicationTaskId", application_task.application_id AS "applicationId", ' +
  'application_task.task_id AS "taskId", application_task.sort_order AS "sortOrder", application_task.updated_at AS "updatedAt", ' +
  'task.title, bureau.name AS bureau, office.name AS office ' +
  'FROM application_task ' +
  'JOIN task ON task.id = application_task.task_id ' +
  'LEFT JOIN bureau ON bureau.bureau_id = task.bureau_id ' +
  'LEFT JOIN office ON office.office_id = task.office_id ' + 
  'WHERE application_task.application_id = ?';

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
  'WHERE experience.application_id = ?';

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

const submittedApplicationCycleQuery = 'SELECT cycle.name ' +
'FROM cycle ' +
'JOIN application on cycle.cycle_id = application.cycle_id ' +
'WHERE application.application_id = ?';

const submittedApplicationCommunityQuery = 'SELECT community.community_name ' +
'FROM community ' +
'JOIN application on community.community_id = application.community_id ' +
'WHERE application.application_id = ?';

module.exports = function (db) {
  return {
    Application: dao({ db: db, table: 'application' }),
    ApplicationLanguageSkill: dao({ db: db, table: 'application_language_skill' }),
    ApplicationSkill: dao({ db:db, table:'application_skill' }),
    ApplicationTask: dao({ db: db, table: 'application_task' }),
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
    },
  };
};
