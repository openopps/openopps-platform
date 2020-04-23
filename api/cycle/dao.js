const _ = require('lodash');
const dao = require('postgres-gen-dao');

const checkProcessingStatusByTaskID = `
  select c.is_processing
  from 
    task t
    inner join "cycle" c on c.cycle_id = t.cycle_id
  where t.id = ?
`;

module.exports = function (db) {
  return {
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    Task: dao({ db: db, table: 'task' }),
    TaskList: dao({ db: db, table: 'task_list' }),
    query: {
      checkProcessingStatus: checkProcessingStatusByTaskID,
    },
  };
};
