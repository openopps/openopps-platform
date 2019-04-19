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
    select count(*) applicant_count from application where cycle_id = ?
`;

dao.query.taskListQuery = `
  select
    task_list_id
  from
    task_list
  where task_id = ? and sort_order = 0
`;

module.exports = function (db) {
    dao.Application = pgdao({ db: db, table: 'application' });
    dao.Task = pgdao({ db: db, table: 'task' });
    dao.TaskList = pgdao({ db: db, table: 'task_list' });
    dao.TaskListApplication = pgdao({ db: db, table: 'task_list_application' });
    dao.TaskListApplicationHistory = pgdao({ db: db, table: 'task_list_application_history' });
    return dao;
};