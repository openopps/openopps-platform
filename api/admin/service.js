const _ = require ('lodash');
const log = require('log')('app:admin:service');
const db = require('../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const TaskMetrics = require('./taskmetrics');
const Audit = require('../model/Audit');
const volunteerService = require('../volunteer/service');
const opportunityService = require('../opportunity/service');

async function getMetrics () {
  var tasks = await getTaskMetrics();
  var users = await getUserMetrics();
  return { 'tasks': tasks, 'users': users };
}

async function getTaskStateMetrics () {
  var states = {};
  states.inProgress = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'in progress' and \"accepting_applicants\" = false", dao.options.task));
  states.completed = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'completed'", dao.options.task));
  states.draft = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'draft'", dao.options.task));
  states.open = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state in ('open', 'in progress') and \"accepting_applicants\" = true", dao.options.task));
  states.notOpen = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'not open'", dao.options.task));
  states.submitted = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'submitted'", dao.options.task));
  states.canceled = dao.clean.task(await dao.Task.query(dao.query.taskStateUserQuery + "state = 'canceled'", dao.options.task));
  return states;
}

async function getAgencyTaskStateMetrics (agencyId) {
  var states = {};
  var agency = (await dao.TagEntity.find("type = 'agency' and id = ?", agencyId))[0];
  states.inProgress = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'in progress' and \"accepting_applicants\" = false", agency.name.toLowerCase(), dao.options.task));
  states.completed = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'completed'", agency.name.toLowerCase(), dao.options.task));
  states.draft = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'draft'", agency.name.toLowerCase(), dao.options.task));
  states.open = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state in ('open', 'in progress') and \"accepting_applicants\" = true", agency.name.toLowerCase(), dao.options.task));
  states.notOpen = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'not open'", agency.name.toLowerCase(), dao.options.task));
  states.submitted = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'submitted'", agency.name.toLowerCase(), dao.options.task));
  states.canceled = dao.clean.task(await dao.Task.query(dao.query.taskAgencyStateUserQuery + "state = 'canceled'", agency.name.toLowerCase(), dao.options.task));
  return states;
}

async function getActivities () {
  var activities = [];
  var result = {};
  var activity = (await dao.Task.db.query(dao.query.activityQuery)).rows;
  for (var i=0; i<activity.length; i++) {
    if (activity[i].type == 'comment') {
      result = (await dao.Task.db.query(dao.query.activityCommentQuery, activity[i].id)).rows;
      activities.push(buildCommentObj(result));
    } else if (activity[i].type == 'volunteer') {
      result = (await dao.Task.db.query(dao.query.activityVolunteerQuery, activity[i].id)).rows;
      activities.push(buildVolunteerObj(result));
    } else if (activity[i].type == 'user') {
      result = await dao.User.findOne('id = ?', activity[i].id);
      activities.push(buildUserObj(result));
    } else {
      result = (await dao.Task.db.query(dao.query.activityTaskQuery, activity[i].id)).rows;
      activities.push(buildTaskObj(result));
    }
  }
  return activities;
}

function buildCommentObj (result) {
  var activity = {};
  activity.itemType = 'task';
  activity.item = {
    title: result[0].title || '',
    id: result[0].taskId || '',
  };
  activity.type = 'newComment';
  activity.createdAt = result[0].createdAt;
  activity.comment = {
    value: result[0].value,
  };
  activity.user = {
    id: result[0].userId,
    username: result[0].username,
    name: result[0].name,
  };
  return activity;
}

function buildUserObj (result) {
  var activity = {};
  activity.type = 'newUser';
  activity.createdAt = result.createdAt;
  activity.user = {
    id: result.id,
    username: result.username,
    name: result.name,
  };
  return activity;
}

function activityObjBase (result, type) {
  var activity = {};
  activity.type = type;
  activity.createdAt = result[0].createdAt;
  activity.task = {
    title: result[0].title || '',
    id: result[0].taskId || '',
  };
  activity.user = {
    id: result[0].userId,
    username: result[0].username,
    name: result[0].name,
  };
  return activity;
}

function buildVolunteerObj (result) {
  return activityObjBase(result, 'newVolunteer');
}

function buildTaskObj (result) {
  return activityObjBase(result, 'newTask');
}

async function getInteractions () {
  var interactions = {};
  var temp = await dao.Task.db.query(dao.query.postQuery);
  interactions.posts = +temp.rows[0].count;
  temp = await dao.Task.db.query(dao.query.volunteerCountQuery);
  interactions.signups = +temp.rows[0].signups;
  interactions.assignments = +temp.rows[0].assignments;
  interactions.completions = +temp.rows[0].completions;

  return interactions;
}

async function getUsers (page, limit) {
  var result = {};
  result.limit = typeof limit !== 'undefined' ? limit : 25;
  result.page = +page || 1;
  result.users = (await dao.User.db.query(await dao.query.userListQuery, page)).rows;
  result.count = result.users.length > 0 ? +result.users[0].full_count : 0;
  result = await getUserTaskMetrics (result);
  return result;
}

async function getUsersForAgency (page, limit, agencyId) {
  var agency = (await dao.TagEntity.find("type = 'agency' and id = ?", agencyId))[0];
  var result = {};
  result.limit = typeof limit !== 'undefined' ? limit : 25;
  result.page = +page;
  result.users = (await dao.User.db.query(await dao.query.userAgencyListQuery, agency.name.toLowerCase(), page)).rows;
  result.count = result.users.length > 0 ? +result.users[0].full_count : 0;
  result = await getUserTaskMetrics (result);
  return result;
}

async function getUsersFiltered (page, query) {
  var result = { page: page, q: query, limit: 25 };
  result.users = (await dao.User.db.query(dao.query.userListFilteredQuery,
    '%' + query.toLowerCase() + '%',
    '%' + query.toLowerCase() + '%',
    page)).rows;
  result = await getUserTaskMetrics (result);
  result.count = typeof result.users[0] !== 'undefined' ? +result.users[0].full_count : 0;
  return result;
}

async function getUsersForAgencyFiltered (page, query, agencyId) {
  var agency = (await dao.TagEntity.find("type = 'agency' and id = ?", agencyId))[0];
  var result = { page: page, q: query, limit: 25 };
  result.users = (await dao.User.db.query(dao.query.userAgencyListFilteredQuery,
    '%' + query.toLowerCase() + '%',
    '%' + query.toLowerCase() + '%',
    agency.name.toLowerCase(),
    page)).rows;
  result = await getUserTaskMetrics (result);
  result.count = typeof result.users[0] !== 'undefined' ? +result.users[0].full_count : 0;
  return result;
}

async function getTaskMetrics () {
  var tasks = (await dao.Task.db.query(dao.query.taskStateQuery)).rows[0];
  tasks.totalCreated = Object.values(tasks).reduce((a, b) => { return a + parseInt(b); }, 0);
  tasks.withVolunteers = (await dao.Task.db.query(dao.query.volunteerQuery, 'withVolunteers')).rows[0].count;
  return tasks;
}

async function getUserMetrics () {
  return (await dao.User.db.query(dao.query.userQuery)).rows[0];
}

async function getUserTaskMetrics (result) {
  var taskStates = [];
  var participantTaskStates = [];
  for (var i = 0; i < result.users.length; i++) {
    taskStates = (await dao.Task.db.query(await dao.query.userTaskState, result.users[i].id)).rows;
    participantTaskStates = (await dao.Task.db.query(await dao.query.participantTaskState, result.users[i].id)).rows;

    result.users[i].tasksCreatedArchived = taskStates.reduce( function ( count, task ) {
      return ( task.state == 'canceled' ) ? count + 1 : count;
    }, 0 );

    result.users[i].tasksCreatedAssigned = taskStates.reduce( function ( count, task ) {
      return ( task.state == 'assigned' ) ? count + 1 : count;
    }, 0 );

    result.users[i].tasksCreatedCompleted = taskStates.reduce( function ( count, task ) {
      return ( task.state == 'completed' ) ? count + 1 : count;
    }, 0 );

    result.users[i].tasksCreatedOpen = taskStates.reduce( function ( count, task ) {
      return ( task.state == 'open' ) ? count + 1 : count;
    }, 0 );

    result.users[i].volCountArchived = participantTaskStates.reduce( function ( count, task ) {
      return ( task.state == 'archived' ) ? count + 1 : count;
    }, 0 );

    result.users[i].volCountAssigned = participantTaskStates.reduce( function ( count, task ) {
      return ( task.state == 'assigned' ) ? count + 1 : count;
    }, 0 );

    result.users[i].volCountCompleted = participantTaskStates.reduce( function ( count, task ) {
      return ( task.state == 'completed' ) ? count + 1 : count;
    }, 0 );

    result.users[i].volCountOpen = participantTaskStates.reduce( function ( count, task ) {
      return ( task.state == 'open' ) ? count + 1 : count;
    }, 0 );
  }
  return result;
}

async function getProfile (id) {
  return await dao.User.findOne('id = ?', id);
}

async function updateProfile (user, done) {
  user.updatedAt = new Date();
  await dao.User.update(user).then(async () => {
    return done(null);
  }).catch (err => {
    return done(err);
  });
}

async function getAgency (id) {
  var agency = await dao.TagEntity.findOne('id = ?', id);
  agency.tasks = (await dao.Task.db.query(dao.query.agencyTaskStateQuery, agency.name.toLowerCase())).rows[0];
  agency.tasks.totalCreated = Object.values(agency.tasks).reduce((a, b) => { return a + parseInt(b); }, 0);
  agency.users = (await dao.User.db.query(dao.query.agencyUsersQuery, id)).rows[0];
  return agency;
}

async function getCommunity (id) {
  var community = await dao.Community.findOne('community_id = ?', id);
  community.tasks = (await dao.Task.db.query(dao.query.communityTaskStateQuery, id)).rows[0];
  community.tasks.totalCreated = Object.values(community.tasks).reduce((a, b) => { return a + parseInt(b); }, 0);
  community.users = (await dao.User.db.query(dao.query.communityUsersQuery, id)).rows[0];
  return community;
}

async function canAdministerAccount (user, id) {
  if (user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, id))) {
    return true;
  }
  return false;
}

async function checkAgency (user, ownerId) {
  var owner = (await dao.User.db.query(dao.query.userAgencyQuery, ownerId)).rows[0];
  if (owner && owner.isAdmin) {
    return false;
  }
  if (owner && owner.name) {
    return _.find(user.tags, { 'type': 'agency' }).name == owner.name;
  }
  return false;
}

async function getExportData () {
  var records = (await dao.User.db.query(dao.query.exportUserData)).rows;
  var fieldNames = _.keys(dao.exportFormat);
  var fields = _.values(dao.exportFormat);

  fields.forEach(function (field, fIndex, fields) {
    if (typeof(field) === 'object') {
      records.forEach(function (rec, rIndex, records) {
        records[rIndex][field.field] = field.filter.call(this, rec[field.field]);
      });
      fields[fIndex] = field.field;
    }
  });

  return json2csv({
    data: records,
    fields: fields,
    fieldNames: fieldNames,
  });
}

async function getDashboardTaskMetrics (group, filter) {
  var tasks = dao.clean.task(await dao.Task.query(dao.query.taskMetricsQuery, {}, dao.options.taskMetrics));
  var volunteers = await dao.Volunteer.find({ taskId: _.map(tasks, 'id') });
  var agencyPeople = dao.clean.users(await dao.User.query(dao.query.volunteerDetailsQuery, {}, dao.options.user));
  var generator = new TaskMetrics(tasks, volunteers, agencyPeople, group, filter);
  generator.generateMetrics(function (err) {
    if (err) res.serverError(err + ' metrics are unavailable.');
    return null;
  });
  return generator.metrics;
}

async function canChangeOwner (user, taskId) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  var agency = _.find(user.tags, { type: 'agency' });
  return task && (task.restrict.name == agency.name);
}

async function getOwnerOptions (taskId, done) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  if (task) {
    done(await dao.User.query(dao.query.ownerListQuery, task.restrict.name));
  } else {
    done(undefined, 'Unable to locate specified task');
  }
}

async function changeOwner (ctx, data, done) {
  var task = await dao.Task.findOne('id = ?', data.taskId).catch((err) => { 
    return undefined;
  });
  if (task) {
    var originalOwner = _.pick(await dao.User.findOne('id = ?', task.userId), 'id', 'name', 'username');
    task.userId = data.userId;
    task.updatedAt = new Date();
    await dao.Task.update(task).then(async () => {
      var audit = Audit.createAudit('TASK_CHANGE_OWNER', ctx, {
        taskId: task.id, 
        originalOwner: originalOwner,
        newOwner: _.pick(await dao.User.findOne('id = ?', data.userId), 'id', 'name', 'username'),
      });
      await dao.AuditLog.insert(audit).then(() => {
        done(audit.data.newOwner);
      }).catch((err) => {
        done(audit.data.newOwner);
      });
    }).catch((err) => {
      done(undefined, 'An error occured trying to change the owner of this task.');
    });
  } else {
    done(undefined, 'Unable to locate specified task');
  }
}

async function assignParticipant (ctx, data, done) {
  var volunteer = await dao.Volunteer.find('"taskId" = ? and "userId" = ?', data.taskId, data.userId);
  if (volunteer.length > 0) {
    done(undefined, 'Participant already has been added.');
  } else {
    await dao.Volunteer.insert({
      taskId: data.taskId,
      userId: data.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      silent: false,
      assigned: false,
      taskComplete: false,
    }).then(async (volunteer) => {
      var audit = Audit.createAudit('TASK_ADD_PARTICIPANT', ctx, {
        taskId: data.taskId,
        participant: _.pick(await dao.User.findOne('id = ?', volunteer.userId), 'id', 'name', 'username'),
      });
      await dao.AuditLog.insert(audit).catch((err) => {
        // TODO: Log audit errors
      });
      var addedVolunteer = await dao.User.findOne('id = ?', volunteer.userId);
      var task = await opportunityService.findById(data.taskId);
      volunteerService.sendAddedVolunteerNotification(addedVolunteer, volunteer, 'volunteer.create.thanks');
      opportunityService.sendTaskAppliedNotification(addedVolunteer, task);
      done(audit.data.participant);
    }).catch((err) => {
      done(undefined, 'Error assigning new participant');
    });
  }
}

async function getAgencies () {
  return await dao.TagEntity.find('type = ?', 'agency');
}

async function getCommunities () {
  return await dao.Community.find();
}

async function createAuditLog (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
}

module.exports = {
  getMetrics: getMetrics,
  getInteractions: getInteractions,
  getUsers: getUsers,
  getAgencies: getAgencies,
  getCommunities: getCommunities,
  getUsersForAgency: getUsersForAgency,
  getUsersFiltered: getUsersFiltered,
  getUsersForAgencyFiltered: getUsersForAgencyFiltered,
  getProfile: getProfile,
  updateProfile: updateProfile,
  getExportData: getExportData,
  getTaskStateMetrics: getTaskStateMetrics,
  getAgencyTaskStateMetrics: getAgencyTaskStateMetrics,
  getAgency: getAgency,
  getCommunity: getCommunity,
  getDashboardTaskMetrics: getDashboardTaskMetrics,
  getActivities: getActivities,
  canAdministerAccount: canAdministerAccount,
  canChangeOwner: canChangeOwner,
  getOwnerOptions: getOwnerOptions,
  changeOwner: changeOwner,
  assignParticipant: assignParticipant,
  createAuditLog: createAuditLog,
};
