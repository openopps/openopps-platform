const db = require('../../../db');
const dao = require('./dao')(db);
const tamperProof = require('../../../utils/tamper-proof');

var service = {};

service.getApplicationSummary = async function (applicationId, sub, auth_time) {
  var results = (await dao.TaskListApplication.db.query(dao.query.ApplicantSummary, applicationId)).rows[0];
  if (results.transcript_id !== null) {
    results.transcript_key = tamperProof.Hmac([sub, auth_time, results.transcript_id].join('|'));
  }
  return results;
};

service.removeApplicationTask  = async function(application_task_id, task_list_application_id){
  return await db.transaction(function* (transaction) {
    yield transaction.query('UPDATE application_task SET is_removed = true, updated_at = NOW() WHERE application_task_id = $1', application_task_id);
    yield transaction.query('DELETE FROM task_list_application WHERE task_list_application_id = $1', task_list_application_id);
  }).then(async () => {
    return true;
  }).catch((err) => {
    return false;
  });
}

module.exports = service;