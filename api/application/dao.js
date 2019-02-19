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

const lookupHonorsQuery= 'select * from lookup_code where lookup_code_type=\'HONORS\' ';
const lookupDegreeLevelsQuery= 'select * from lookup_code where lookup_code_type=\'DEGREE_LEVEL\'';

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
    LanguageSkill: dao({ db: db, table: 'language_skill' }),
    LookupCode:dao({ db: db, table: 'lookup_code' }),
    Reference:dao({ db:db, table:'reference'}),
    Task: dao({ db: db, table: 'task' }),
    LookUpCode:dao({ db:db, table:'lookup_code'}),

    query: {
      application: applicationQuery,
      applicationTasks: applicationTasksQuery,
      lookupHonors:lookupHonorsQuery,
      lookupDegreeLevels:lookupDegreeLevelsQuery,
    },
  };
};
