const _ = require('lodash');
const dao = require('postgres-gen-dao');

const applicationQuery = 'SELECT @application.* ' +
  'FROM @application application ' +
  'WHERE application.application_id = ?';

const applicationTasksQuery = 'SELECT ' +
  'application_task.application_task_id, application_task.application_id, ' +
  'application_task.task_id, application_task.sort_order, ' +
  'task.title, bureau.name as bureau, office.name as office ' +
  'FROM application_task ' +
  'JOIN task ON task.id = application_task.task_id ' +
  'LEFT JOIN bureau ON bureau.bureau_id = task.bureau_id ' +
  'LEFT JOIN office ON office.office_id = task.office_id ' +
  'WHERE application_task.application_id = ?';

const applicationEducationQuery = 'SELECT @education.*, @country.*, @countrySubdivision.* ' +
  'FROM @education education ' + 
  'JOIN @country country on country.country_id = education.country_id ' +
  'LEFT JOIN @country_subdivision countrySubdivision on "countrySubdivision".country_subdivision_id = education.country_subdivision_id ' +
  'WHERE education.application_id = ?';

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

const countryQuery= 'select country.country_id as "id", country.country_id as "countryId",country.code,country.value ' +
  'from country ' + 'join education on country.country_id = education.country_id ' + 
  'where education.education_id = ? ';

module.exports = function (db) {
  return {
    Application: dao({ db: db, table: 'application' }),
    ApplicationTask: dao({ db: db, table: 'application_task' }),
    Community: dao({ db: db, table: 'community' }),
    Country:dao({ db: db, table: 'country' }),
    CountrySubdivision: dao({ db: db, table: 'country_subdivision' }),
    Education: dao({ db: db, table: 'education' }),
    Experience: dao({ db: db, table: 'experience' }),
    Language: dao({ db: db, table: 'language' }),
    ApplicationLanguageSkill: dao({ db: db, table: 'application_language_skill' }),
    LookupCode:dao({ db: db, table: 'lookup_code' }),
    Reference:dao({ db:db, table:'reference'}),
    Task: dao({ db: db, table: 'task' }),
    LookUpCode:dao({ db:db, table:'lookup_code'}),

    query: {
      application: applicationQuery,
      applicationTasks: applicationTasksQuery,
      applicationEducation: applicationEducationQuery,
      applicationExperience: applicationExperienceQuery,
      applicationLanguage: applicationLanguageQuery,
      applicationReference: applicationReferenceQuery,
      country: countryQuery,
    },
  };
};
