const db = require('../../../db');
const dao = require('./dao')(db);

var service = {};

service.getInternships = async function (userId) {
  var results = await dao.Task.db.query(dao.query.internshipListQuery, userId);
  return results.rows;
};

service.getInternshipsArchive = async function (userId) {
  var results = await dao.Task.db.query(dao.query.internshipArchiveListQuery, userId);
  return results.rows;
};

service.getInternshipSummary = async function (taskId) {
  var results = await dao.Task.db.query(dao.query.internshipSummaryQuery, taskId);
  return results.rows[0];
};

service.getTaskShareList = async function (taskId, userId) {
  var results = await dao.Task.db.query(dao.query.taskShareQuery, taskId, userId);
  return results.rows;
};

service.getTaskList = async function (userId, taskId) {
  var results = await dao.Task.db.query(dao.query.taskListQuery, taskId);

  if (results.rows.length == 0) {
    var listNames = ['For review', 'Interviewing', 'Interviewed', 'Offer out', 'Accepted', 'Alternate'];
    for (let i = 0; i < listNames.length; i++) {
      await createTaskList(listNames[i], taskId, userId, i);
    }
    await populateApplicantList(taskId, userId);
    // eslint-disable-next-line no-redeclare
    var results = await dao.Task.db.query(dao.query.taskListQuery, taskId);
  }
  for (let i = 0; i < results.rows.length; i++) {
    results.rows[i].applicants = await getApplicants(results.rows[i].task_list_id);
  }
  return results.rows;
};

service.updateTaskList = async function (user, toUpdate) {
  var updated = [];
  for (let i = 0; i < toUpdate.length; i++) {
    var list = await dao.TaskList.query(dao.query.taskListAndOwner, toUpdate[i].task_list_id, user.id);
    if (list.length == 1)
    {
      var listItem = list[0];
      listItem.updatedBy = user.id;
      await dao.TaskList.update(listItem);
      updated.push(await updateListApplicant(user.id, toUpdate[i]));
    }
    else {
      throw new Error('Error updating task list');
    }
  }
  return new Date;
};

service.getCommunityUserByTaskAndEmail = async function (taskId, email) {
  return (await dao.Community.db.query(dao.query.communityByTaskAndEmail, taskId, email)).rows;
};

service.addTaskOwner = async function (taskId, shareWithUserId, sharedByUserId, user) {
  var record = {
    taskId: taskId,
    userId: shareWithUserId,
    shared_by_user_id: sharedByUserId,
  };
  var historyRecord = {
    taskId: taskId,
    userId: shareWithUserId,
    action: 'insert',
    actionBy: sharedByUserId,
    actionDate: new Date,
    details: { 
      'shared_by_user_id': sharedByUserId, 
      'action_by_username': user.username, 
    },
  };
  var taskShare = await dao.TaskShare.find('task_id = ? and user_id = ?', taskId, shareWithUserId);
  if (taskShare.length == 0)
  {
    return await db.transaction(function*() {
      yield dao.TaskShareHistory.insert(historyRecord);
      return yield dao.TaskShare.insert(record);
    });            
  } else {
    return null;
  }
};

service.removeTaskOwner = async function (userId, params) {
  if (userId == params.userId) {
    var canRemoveOwner = true;
  } else {
    // eslint-disable-next-line no-redeclare
    var canRemoveOwner =  await dao.TaskShare.findOne('task_id = ? and user_id = ?', params.taskId, userId);
  }

  if (canRemoveOwner) {
    var owner = await dao.TaskShare.findOne('task_id = ? and user_id = ?', params.taskId, params.userId);
    if (owner) {
      var historyRecord = {
        taskId: owner.taskId,
        userId: owner.userId,
        action: 'delete',
        actionBy: userId,
        actionDate: new Date,
        details: { 'shared_by_user_id': owner.sharedByUserId },
      };
      return await db.transaction(function*() {
        yield dao.TaskShareHistory.insert(historyRecord);
        return yield dao.TaskShare.delete(owner);
      });
    }
    else {
      throw new Error('Error removing owner');
    }
  }
  throw new Error('Error removing owner');
};

async function updateListApplicant (userId, item) {
  var applicant = await dao.TaskListApplication.query(dao.query.taskListApplicationAndOwner, item.task_list_application_id, userId);
  var applicantItem = applicant[0];
  if (applicant.length == 1)
  {
    var historyRecord = {
      taskListApplicationId: applicantItem.taskListApplicationId,
      action: 'update',
      actionBy: userId,
      actionDate: new Date,
      details: { 
        previous: {
          'task_list_id': applicantItem.taskListId,
          //'application_id': applicant.applicationId,
          'sort_order': applicantItem.sortOrder,
          // 'date_last_viewed': applicant.dateLastViewed,
          // 'date_last_contacted': applicant.dateLastContacted,
          'updated_at': applicantItem.updatedAt,
          'updated_by': applicantItem.updatedBy,
        },
        'task_list_id': item.task_list_id,
        'sort_order': item.sort_order,
      },
    };  
    if (historyRecord.details.task_list_id == historyRecord.details.previous.task_list_id)
    {
      delete historyRecord.details.task_list_id;
      delete historyRecord.details.previous.task_list_id;
    }   
    if (historyRecord.details.sort_order == historyRecord.details.previous.sort_order)
    {
      delete historyRecord.details.sort_order;
      delete historyRecord.details.previous.sort_order;
    }  
    applicantItem.taskListId = item.task_list_id;
    applicantItem.sortOrder = item.sort_order;
    applicantItem.updatedBy = userId;
    return await db.transaction(function*() {
      yield dao.TaskListApplicationHistory.insert(historyRecord);
      return yield dao.TaskListApplication.update(applicantItem);
    });      
  }
  else {
    throw new Error('Error updating card movement');
  }
}

async function createTaskList (listName, taskId, userId, sortOrder) {
  var list = {
    task_id: taskId,
    title: listName,
    sort_order: sortOrder,
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: userId,
  };
  return await dao.TaskList.insert(list);
}

async function populateApplicantList (taskId, userId) {
  var taskList = await dao.TaskList.findOne('task_id = ? and sort_order = 0', taskId);
  var missingApplications = (await dao.TaskListApplication.db.query(dao.query.applicationsNotInListQuery, taskId)).rows;
  for (let i = 0; i < missingApplications.length; i++) {
    await createTaskListApplication(missingApplications[i], taskList.taskListId, userId);
  }
}

async function createTaskListApplication (item, taskListId, userId) {
  var list = {
    task_list_id: taskListId,
    application_id: item.application_id,
    sort_order: item.application_id,
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: userId,
  };

  return await dao.TaskListApplication.insert(list);
}

async function getApplicants (task_list_id) {
  var applications = await dao.TaskListApplication.db.query(dao.query.taskListApplicationQuery, task_list_id);
  return applications.rows;
}

module.exports = service;