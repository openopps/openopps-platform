const db = require('../../../db');
const dao = require('./dao')(db);
const tamperProof = require('../../../utils/tamper-proof');

var service = {};

service.getApplicationSummary = async function (taskListApplicationId, sub, auth_time) {
  var results = (await dao.TaskListApplication.db.query(dao.query.ApplicantSummary, taskListApplicationId)).rows[0];
  if (results.transcript_id !== null) {
    results.transcript_key = tamperProof.Hmac([sub, auth_time, results.transcript_id].join('|'));
  }
  if (results.linked_id !== null) {
    results.linked_key = tamperProof.Hmac([sub, auth_time, results.linked_id].join('|'));
  }
  return results;
};

service.removeApplicationTask  = async function(task_id, application_task_id, task_list_application_id, user){
  var taskListApplicationRecord = await dao.TaskListApplication.findOne('task_list_application_id = ?', task_list_application_id);
  var historyRecord = {
    taskListApplicationId: task_list_application_id,
    action: 'delete',
    actionBy: user.id,
    actionDate: new Date,
    details: { 
        'removed_by_userId': user.id, 
        'action_by_username': user.username,
        'task_list_id': taskListApplicationRecord.taskListId,
        'application_id': taskListApplicationRecord.applicationId,
        'sort_order': taskListApplicationRecord.sortOrder,
        'date_last_viewed': taskListApplicationRecord.dateLastViewed,
        'date_last_contacted': taskListApplicationRecord.dateLastContacted,
        'created_at': taskListApplicationRecord.createdAt,
        'updated_at': taskListApplicationRecord.updatedAt,
        'updated_by': taskListApplicationRecord.updatedBy,
    },
    taskId: task_id,
    application_id: taskListApplicationRecord.applicationId,
  }
  return await db.transaction(function* () {
    yield dao.ApplicationTask.query('UPDATE application_task SET is_removed = true, updated_at = NOW() WHERE application_task_id = ?', application_task_id);
    yield dao.TaskListApplicationHistory.query('DELETE FROM task_list_application WHERE task_list_application_id = ?', task_list_application_id);
    yield dao.TaskListApplicationHistory.insert(historyRecord);
  }).then(async () => {
    return true;
  }).catch((err) => {
    return false;
  });
};

service.updateLastContacted = async function (emails) {
  
  await emails.forEach(email => {
    dao.TaskListApplication.db.query('update task_list_application set date_last_contacted = ?, template_name = ? where task_list_application_id = ?',email.date_last_contacted, email.template_name, email.task_list_application_id);
  });
  return true;
};

module.exports = service;