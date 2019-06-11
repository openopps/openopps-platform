const db = require('../../../db');
const dao = require('./dao')(db);
var _ = require('lodash');
const Audit = require('../../model/Audit');

var service = {};

var internships = null;
var numOfApplicants = 0;
var numOfInternships = 0;
var remainingApplicants = 0;
var internsAssigned = 0;

service.getPhaseData = async function (cycleId) {
  var results = {};
  var phaseData = await dao.Task.db.query(dao.query.GetPhaseData, cycleId);
  results = phaseData.rows[0];
  var sequence = results.current_sequence === 0 ? 1 : results.current_sequence;
  var phases = await dao.Task.db.query(dao.query.GetPhases, sequence, sequence + 1);
  results.phase_one = phases.rows[0];
  results.phase_two = phases.rows[1];
  return results;
};

service.startPhaseProcessing = async function (cycleId) {
  var cycle = await dao.Cycle.findOne('cycle_id = ?', cycleId);
  cycle.isProcessing = true;
  return await dao.Cycle.update(cycle);
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
  var internshipIndex = getNextInternshipIndex(internshipIndex);
  var currentInternship = internships[internshipIndex];
  do
  {      
    await assignIntern(currentInternship, userId);       
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
  dao.ErrorLog.insert({ userId: userId, errorData: err }).catch();
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
    internships[i].max_sort = 0;
    internships[i].reviewList = await getReviewList(internships[i].task_id);
    internships[i].remainingInternships = Number(internships[i].interns) + (Number(internships[i].interns) * Number(internships[i].alternate_rate));
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
  internships = (await dao.Task.db.query(dao.query.getTaskTotalScore, cycleId)).rows;
  numOfApplicants = (await dao.Application.db.query(dao.query.getApplicationCount, cycleId)).rows[0].applicant_count;
  remainingApplicants = numOfApplicants;
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
    };
    internship.max_sort = internship.max_sort + 1;
    return yield dao.TaskListApplicationHistory.insert(historyRecord);      
  }); 
}

module.exports = service;