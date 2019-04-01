const pgdao = require('postgres-gen-dao');

var dao = {};
dao.query = {};

dao.query.countryData = `
    select country_id, country_subdivision_id
    from country inner join country_subdivision on country.code = country_subdivision.parent_code
`;

module.exports = function (db) {
    dao.Application = pgdao({ db: db, table: 'application' });
    dao.ApplicationTask = pgdao({ db: db, table: 'application_task' });
    dao.Education = pgdao({ db: db, table: 'education' });
    dao.Language = pgdao({ db: db, table: 'language' });
    dao.Experience = pgdao({ db: db, table: 'experience' });
    dao.Reference = pgdao({ db: db, table: 'reference' });
    dao.User = pgdao({ db: db, table: 'midas_user' });
    dao.Task = pgdao({ db: db, table: 'task' });
    dao.TaskList = pgdao({ db: db, table: 'task_list' });
    dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
    dao.LookupCode = pgdao({ db: db, table: 'lookup_code' });
    dao.ApplicationLanguageSkill = pgdao({ db: db, table: 'application_language_skill' });
    dao.ApplicationSkill = pgdao({ db: db, table: 'application_skill' });
    dao.TagEntity = pgdao({ db: db, table: 'tagentity' });
    return dao;
};
  