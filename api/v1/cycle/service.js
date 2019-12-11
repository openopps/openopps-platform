const db = require('../../../db');
const dao = require('./dao')(db);
var _ = require('lodash');
const Audit = require('../../model/Audit');
const notification = require('../../notification/service');
const util = require('util');

var service = {};

var internships = null;
var numOfApplicants = 0;
var numOfInternships = 0;
var remainingApplicants = 0;
var internsAssigned = 0;

service.checkIsManager = async function (userId, cycleId) {
  var user = await dao.Community_User.db.query(dao.query.isCommunityManager, userId, cycleId);
  return user.rows[0].is_manager;
};

service.checkIsJOACreated = async function (cycleId) {
  var user = await dao.Cycle.db.query(dao.query.isJOACreated, cycleId);
  return (user.rows[0].secondary_application_url != null && user.rows[0].secondary_application_url.trim() != '');
};

service.getPhaseData = async function (userId, cycleId) {
  var results = {};
  var phaseData = await dao.Task.db.query(dao.query.GetPhaseData, userId, cycleId);
  results = phaseData.rows[0];
  var sequence = results.current_sequence === 0 ? 1 : results.current_sequence;
  var phases = await dao.Task.db.query(dao.query.GetPhases, sequence, sequence + 1);
  results.phase_one = phases.rows[0];
  results.phase_two = phases.rows[1];
  return results;
};

service.checkCycleStatus = async function (cycleId) {
  var results = await dao.Cycle.findOne('cycle_id = ?', cycleId).catch(() => { return null; });
  return results.isProcessing;
};

service.startPhaseProcessing = async function (cycleId) {
  var cycle = await dao.Cycle.findOne('cycle_id = ?', cycleId);
  cycle.isProcessing = true;
  return await dao.Cycle.update(cycle);
};

service.startAlternateProcessing = async function (user, cycleId) {
  var applicationsToRemove = (await dao.TaskListApplication.db.query(dao.query.GetApplicationsToRemoveForPhase, cycleId)).rows;
  for(let i=0; i < applicationsToRemove.length; i++) {
    var historyRecord = {
      taskListApplicationId: applicationsToRemove[i].task_list_application_id,
      action: 'delete',
      actionBy: user.id,
      actionDate: new Date,
      details: {
          'removed_by_userId': user.id, 
          'action_by_username': user.username,
          'phase': 'Alternate phase',
          'task_list_id': applicationsToRemove[i].task_list_id,
          'application_id': applicationsToRemove[i].application_id,
          'sort_order': applicationsToRemove[i].sort_order,
          'date_last_viewed': applicationsToRemove[i].date_last_viewed,
          'date_last_contacted': applicationsToRemove[i].date_last_contacted,
          'created_at': applicationsToRemove[i].created_at,
          'updated_at': applicationsToRemove[i].updated_at,
          'updated_by': applicationsToRemove[i].updated_by,
      },
      taskId: applicationsToRemove[i].task_id,
      application_id: applicationsToRemove[i].application_id,
    }
    await dao.TaskListApplicationHistory.insert(historyRecord);
  }
  await dao.Cycle.db.query(dao.query.RemoveApplicationsForPhase, cycleId).then(async () => {
    var cycle = await dao.Cycle.findOne('cycle_id = ?', cycleId);
    cycle.isProcessing = true;
    return await dao.Cycle.update(cycle);
  }).catch (err => { return done(null, false, {'message':'Error updating task.'}); });
};

service.archivePhase = async function (cycleId) {
  var cycle = await dao.Cycle.findOne('cycle_id = ?', cycleId).catch(() => { return null; });
  var closedPhase = await dao.Phase.findOne('name = ?', 'Close phase');
  if (closedPhase != null) {
    cycle.phaseId = closedPhase.phaseId;
    cycle.closedDate = new Date();
  }
  cycle.isArchived = true;
  await dao.Cycle.update(cycle);
  await service.sendCloseCyclePhaseSelectedNotification(cycleId);
  await service.sendCloseCyclePhaseAlternateNotification(cycleId);
  await service.sendCloseCyclePhaseNotSelectedNotification(cycleId);
  await service.sendCloseCyclePhaseCreatorNotification(cycleId);
  await service.sendCloseCyclePhaseCommunityUserNotification(cycleId);
  return await service.sendCloseCyclePhaseCommunityManagerNotification(cycleId);
};

service.updatePhaseForCycle = async function (cycleId) {
  var cycle = await dao.Cycle.findOne('cycle_id = ?', cycleId);
  if (cycle != null) {
    var phaseId = cycle.phaseId;
    if (cycle.phaseId == null) {
      await dao.Phase.findOne('sequence = ?', 1).then(phase => {
        phaseId = phase.phaseId;
      });
    } else {
      var currentPhase = await dao.Phase.findOne('phase_id = ?', cycle.phaseId);
      var nextPhase = await dao.Phase.findOne('sequence = ?', currentPhase.sequence + 1);
      phaseId = nextPhase.phaseId;
    }
    cycle.phaseId = phaseId;
    cycle.isProcessing = false;
    await dao.Cycle.update(cycle);
    return phaseId;
  }
};

service.drawMany = async function (userId, cycleId) {
  await initializeDraw(cycleId);
  await initializeBoard(userId);
  var internshipIndex = 0;
  internshipIndex = getNextInternshipIndex(internshipIndex);
  var currentInternship = internships[internshipIndex];
  do
  {      
    var applicationId = await assignIntern(currentInternship, userId);   
    if (applicationId == null) { 
      break; 
    }    
    remainingApplicants--;
    currentInternship.remainingInternships--;
    internshipIndex++;
    internshipIndex = getNextInternshipIndex(internshipIndex);
    currentInternship = internships[internshipIndex];
  } while (haveMoreApplicants() && haveMoreEmptyInternships());
    
  var stats = {
    numOfApplicants: numOfApplicants,
    numOfInternships: numOfInternships,
    internsAssigned: internsAssigned,
    internshipsLength: internships.length,
  };
  console.log(stats);
  return stats;
};

service.drawOne = async function (userId, taskId) {
  var applicationId = null;
  var internship = (await dao.Task.db.query(dao.query.getTaskIdAndListId, taskId)).rows[0];
  if (internship != null) {
    applicationId = await assignIntern(internship, userId);
  }
  if (applicationId !== null) {
    return await dao.Application.db.query(dao.query.getOneIntern, applicationId);
  }
  return null;
};

service.createAuditLog = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

service.recordError = async function (userId, err) {
  dao.ErrorLog.insert({
    userId: userId,
    errorData: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
  }).catch();
};

service.sendPrimaryPhaseStartedCommunityNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getAllCommunityUsers, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/firstphase.start.community',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          title: results[i].title,
          reviewboardlink: process.env.AGENCYPORTAL_URL + '/reviews/',
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  }
}; 

service.sendPrimaryPhaseStartedNotification = async function (user, boardsPopulated) {
  var data = {
    action: 'state.department/firstphase.start.confirmation',
    model: {
      user: user,
      agencyportallink: openopps.agencyportalURL,
      alternatephaselink: openopps.agencyportalURL + '/reviews',
      boardspopulated: boardsPopulated ? 'success' : 'fail',
      emailsqueued: 'success',
      systemname: 'USAJOBS Agency Talent Portal',
      urlprefix: openopps.agencyportalURL,
      logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',
    },
    layout: 'state.department/layout.html',
  };
  notification.createNotification(data);
  var throttle = await checkEmailThrottle(i, 20);
};

service.sendAlternatePhaseStartedNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getCommunityUsers, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/alternatephase.start.communityusers',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          title: results[i].title,
          reviewboardlink: process.env.AGENCYPORTAL_URL + '/review/' + results[i].task_id,
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.sendCloseCyclePhaseSelectedNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getApplicantSelected, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.selected',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          bureau_office: results[i].bureau_office,
          location: results[i].location,
          suggested_security_clearance: results[i].suggested_security_clearance,
          session: results[i].session,
          jobLink: results[i].joblink,
          title: results[i].title,
          contact_email: results[i].contact_email,
          contact_name: results[i].contact_name,      
        },
        layout: 'state.department/layout2.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.sendCloseCyclePhaseNotSelectedNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getApplicantNotSelected, cycleId)).rows;
  var numOfApplicants = (await dao.Application.db.query(dao.query.getApplicationCount, cycleId)).rows[0].applicant_count;  
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.notselected',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          session: results[i].session,
          applicationsCount: numOfApplicants,
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',       
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.sendCloseCyclePhaseAlternateNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getApplicantAlternate, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.alternate',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          bureau_office: results[i].bureau_office,
          location: results[i].location,
          suggested_security_clearance: results[i].suggested_security_clearance,
          session: results[i].session,
          jobLink: results[i].joblink,
          title: results[i].title,
          contact_email: results[i].contact_email,
          contact_name: results[i].contact_name,     
        },
        layout: 'state.department/layout2.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.downloadReport = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.GetCycleApplicantData, cycleId)).rows;
  return results;
};

service.sendCloseCyclePhaseCreatorNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getCommunityCreators, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.creators',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          title: results[i].title,
          archivelink: process.env.AGENCYPORTAL_URL + '/reviews/',
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',       
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.sendCloseCyclePhaseCommunityUserNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getCommunityUsers, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.communityusers',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          title: results[i].title,
          archivelink: process.env.AGENCYPORTAL_URL + '/reviews/',
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',       
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

service.sendCloseCyclePhaseCommunityManagerNotification = async function (cycleId) {
  var results = (await dao.Cycle.db.query(dao.query.getCommunityManagers, cycleId)).rows;
  if (results != null && results.length > 0) {
    for (let i = 0; i < results.length; i++) {
      var data = {
        action: 'state.department/closecyclephase.start.communitymanagers',
        model: {
          given_name: results[i].given_name,
          email: results[i].email,
          title: results[i].title,
          archivelink: process.env.AGENCYPORTAL_URL + '/reviews/',
          systemname: 'USAJOBS Agency Talent Portal',
          urlprefix: openopps.agencyportalURL,
          logo: '/Content/usaj-design-system/img/logo/png/red-2x.png',       
        },
        layout: 'state.department/layout.html',
      };
      notification.createNotification(data);
      var throttle = await checkEmailThrottle(i, 20);
    }
  } 
};

function checkEmailThrottle(index, limit) {
  return new Promise(resolve => {
    if((index + 1) % limit == 0) {
      setTimeout(resolve, 1500);
    } else {
      resolve();
    }
  });
};

function getNextInternshipIndex (internshipIndex) {
  var counter = 0;
  if(internshipIndex >= internships.length) {
    internshipIndex = 0;
  }
  while (internships[internshipIndex].remainingInternships <= 0 && counter <= internships.length) {
    internshipIndex++;
    if(internshipIndex >= internships.length) {
      internshipIndex = 0;
    }
    counter++;
  }
  return internshipIndex;
}

async function initializeBoard (userId) {
  if (internships == null) {
    return;
  }
  for(let i=0; i < internships.length; i++) {
    if (!(await boardExists(internships[i].task_id))) {
      await createBoard(internships[i].task_id, userId);            
    }
    var existingApplicationsCount = (await dao.Application.db.query(dao.query.getTaskApplicationCount, internships[i].task_id)).rows[0].applicant_count;
    internships[i].max_sort = 0;
    internships[i].reviewList = await getReviewList(internships[i].task_id);
    internships[i].remainingInternships = (Number(internships[i].interns) + (Number(internships[i].interns) * Number(internships[i].alternate_rate))) - existingApplicationsCount;
  }
}

async function getReviewList (taskId) {
  var result = (await dao.Task.db.query(dao.query.taskListQuery, taskId)).rows;
  if (result != null && result.length > 0) {
    return result[0].task_list_id;
  }
  return null;
}

async function initializeDraw (cycleId) {
  var numOnBoards = (await dao.Application.db.query(dao.query.getApplicationExistingCount, cycleId)).rows[0].applicant_count;
  internships = (await dao.Task.db.query(dao.query.getTaskTotalScore, cycleId)).rows;
  numOfApplicants = (await dao.Application.db.query(dao.query.getApplicationCount, cycleId)).rows[0].applicant_count;
  remainingApplicants = numOfApplicants - numOnBoards;
  numOfInternships = _.sumBy(internships, function (i) { return Number(i.interns) + (Number(i.interns) * Number(i.alternate_rate)); });
}

async function boardExists (taskId) {
  var reviewList = await dao.Task.db.query(dao.query.taskListQuery, taskId);
  return reviewList.rows.length > 0;
}

async function createBoard (taskId, userId) {
  var listNames = ['For review', 'Interviewing', 'Interviewed', 'Primary', 'Alternate'];
  for (let i = 0; i < listNames.length; i++) {
    await createTaskList(listNames[i], taskId, userId, i);
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

function haveMoreApplicants () {
  return remainingApplicants > 0;
}

function haveMoreEmptyInternships () {
  for (let i=0; i < internships.length; i++) {
    if (internships[i].remainingInternships > 0) {
      return true;
    }
  }
  return false;
}

async function assignIntern (internship, userId) {
  var intern = await getTopApplicantScoreByTaskWithPreference(internship);
  if (!intern) {
    intern = await getInternWithApplication(internship);
  }
  if (!intern) {
    return null;
  }
  await updateBoard(internship, intern, userId);
  return intern.application_id;
}

async function getInternWithApplication (internship) {
  var result = (await dao.Task.db.query(dao.query.getTopApplicantScoreByTask, internship.task_id)).rows;
  if (result != null && result.length > 0) {
    return result[0];
  }
  return null;
}

async function getTopApplicantScoreByTaskWithPreference (internship) {
  var result = (await dao.Task.db.query(dao.query.getTopApplicantScoreByTaskWithPreference, internship.task_id)).rows;
  if (result != null && result.length > 0) {
    return result[0];
  }
  return null;
}

async function updateBoard (internship, intern, userId) {
  internsAssigned++;
  await createTaskListApplication(intern, internship, userId);
}
  
async function createTaskListApplication (item, internship, userId) {
  var list = {
    task_list_id: internship.reviewList,
    application_id: item.application_id,
    sort_order: internship.max_sort,
    created_at: new Date(),
    updated_at: new Date(),
    updated_by: userId,
  };
  return await db.transaction(function*() {
    var applicationTask = yield dao.ApplicationTask.find('application_id = ? and task_id = ?', item.application_id, internship.task_id);
    if (applicationTask.length == 0) {
      var newApplicationTask = {
        application_id: item.application_id,
        user_id: item.user_id,
        task_id: item.task_id,
        sort_order: -1,
        created_at: new Date,
        updated_at: new Date,
        is_removed: false,
      };
      yield dao.ApplicationTask.insert(newApplicationTask);
    }
    var record = yield dao.TaskListApplication.insert(list);
    var historyRecord = {
      taskListApplicationId: record.taskListApplicationId,
      action: 'insert',
      actionBy: userId,
      actionDate: new Date,
      details: { 
        'task_list_id': internship.reviewList,
        'sort_order': internship.max_sort,
      },
      taskId: item.task_id,
      applicationId: item.application_id,
    };
    internship.max_sort = internship.max_sort + 1;
    return yield dao.TaskListApplicationHistory.insert(historyRecord);      
  }); 
}

service.getCommunityUsers = async function (cycleId) {
  var results = await dao.Task.db.query(dao.query.getAllCommunityUsers, cycleId);  
  return results.rows;
};


module.exports = service;
