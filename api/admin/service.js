const _ = require ('lodash');
const fs = require('fs');
const log = require('log')('app:admin:service');
const db = require('../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const TaskMetrics = require('./taskmetrics');
const Audit = require('../model/Audit');
const volunteerService = require('../volunteer/service');
const opportunityService = require('../opportunity/service');
const elasticService = require('../../elastic/service');
const communityService = require('../community/service');

function getWhereClauseForTaskState (state) {
  if (state == 'open') {
    return "state in ('open', 'in progress') and \"accepting_applicants\" = true";
  } else if (state == 'in progress') {
    return "state = 'in progress' and \"accepting_applicants\" = false";
  } else {
    return "state = '" + state + "'";
  }
}

function getOrderByClause (sortValue) {
  switch (sortValue) {
    case 'title':
      return 'lower(tasks.title)';
    case 'creator':
      return 'lower(tasks.owner->>\'last_name\'), lower(tasks.owner->>\'given_name\')';
    default:
      return 'tasks."createdAt" desc';
  }
}

function getUserListOrderByClause (sortValue) {
  switch (sortValue) {
    case 'name':
      return 'lower(users.last_name), lower(users.given_name)';
    case 'createdAt':
      return 'users."createdAt" desc';
    case 'last_login':
      return 'users.last_login desc';
    case 'isAdmin':
      return 'users."isAdmin" desc';
    case 'isAgencyAdmin':
        return 'users."isAgencyAdmin" desc';
    case 'is_manager':
      return 'users.is_manager desc';
    case 'agency':
      return 'users.agency->>\'name\'';
    default:
      return sortValue;
  }
}

function getWhereClauseForCyclicalTaskState (state) {
  if (state == 'approved') {
    return "state = 'open' and apply_start_date > now()";
  } else if (state == 'open') {
    return "state = 'open' and apply_start_date <= now()";
  } else {
    return "state = '" + state + "'";
  }
}

module.exports = {};

module.exports.getMetrics = async function () {
  var tasks = await getTaskMetrics();
  var users = await getUserMetrics();
  return { 'tasks': tasks, 'users': users };
};

module.exports.getCommunityTaskStateMetrics = async function (communityId, state, page, sort, filter){
  var community = await communityService.findById(communityId);

  if (community.duration == 'Cyclical') {
    var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getCyclicalCommunityTaskStateTotals.sql', 'utf8');
    var tasksByStateQuery = fs.readFileSync(__dirname + '/sql/getCyclicalTasksByState.sql', 'utf8').toString();
    var whereClause = 'tasks.community_id = ? and ' + getWhereClauseForCyclicalTaskState(state);
   
  } else {
    var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getCommunityTaskStateTotals.sql', 'utf8');
    var tasksByStateQuery = fs.readFileSync(__dirname + '/sql/getTasksByState.sql', 'utf8').toString();
    var whereClause = 'tasks.community_id = ? and ' + getWhereClauseForTaskState(state);
  }

  if (community.targetAudience != "Students") {
    var agency = ' or lower(agency->>\'name\') like \'%' + filter.toLowerCase() + '%\'';
  } else {
    var office = ' or lower(office->>\'name\') like \'%' + filter.toLowerCase() + '%\'';
    var bureau = ' or lower(bureau->>\'name\') like \'%' + filter.toLowerCase() + '%\'';
  }

  if (filter) {
    whereClause += ' and (lower(title) like \'%' + filter.toLowerCase() + '%\' or lower(owner->>\'name\') like \'%' + filter.toLowerCase() 
    + '%\'' + agency + office + bureau +')';
  } 

  tasksByStateQuery = tasksByStateQuery.replace('[where clause]', whereClause).replace('[order by]', getOrderByClause(sort));
  
  return Promise.all([
    db.query(taskStateTotalsQuery, communityId),
    db.query(tasksByStateQuery, [communityId, page]),
  ]);
};

module.exports.getTaskStateMetrics = async function (state, page, sort) {
  var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getSitewideTaskStateTotals.sql', 'utf8');
  var tasksByStateQuery = fs.readFileSync(__dirname + '/sql/getTasksByState.sql', 'utf8').toString();
  var whereClause = '(target_audience <> 2 or target_audience is null) and ' + getWhereClauseForTaskState(state);
  tasksByStateQuery = tasksByStateQuery.replace('[where clause]', whereClause).replace('[order by]', getOrderByClause(sort));
  return Promise.all([
    db.query(taskStateTotalsQuery),
    db.query(tasksByStateQuery, page),
  ]);
};

module.exports.getAgencyTaskStateMetrics = async function  (agencyId, state, page, sort, filter) {
  var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getAgencyTaskStateTotals.sql', 'utf8');
  var tasksByStateQuery = fs.readFileSync(__dirname + '/sql/getTasksByState.sql', 'utf8').toString();
  var whereClause = 'tasks.agency_id = ? and tasks.community_id is null and ' + getWhereClauseForTaskState(state);
  tasksByStateQuery =  tasksByStateQuery.replace('[where clause]', whereClause).replace('[order by]', getOrderByClause(sort));
  return Promise.all([
    db.query(taskStateTotalsQuery, agencyId),
    db.query(tasksByStateQuery, [agencyId, page]),
  ]);
};

module.exports.getActivities = async function () {
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
};

module.exports.getAgencyActivities = async function (agencyId) {
  // var agency = await dao.Agency.findOne('agency_id = ?', id);
  var activities = [];
  var result = {};
  var activity = (await dao.Task.db.query(dao.query.agencyActivityQuery, { agencyId: agencyId })).rows;
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
      result = (await dao.Task.db.query(dao.query.agencyActivityTaskQuery, [activity[i].id, agencyId])).rows;
      activities.push(buildTaskObj(result));
    }
  }
  return activities;
};

module.exports.getCommunityActivities = async function (communityId) {
  var community = await communityService.findById(communityId);
  var activities = [];
  var result = {};
  var activity = (await dao.Task.db.query(dao.query.communityActivityQuery, { communityId: communityId })).rows;
  for (var i=0; i<activity.length; i++) {
    if (activity[i].type == 'user') {
      result = await dao.User.findOne('id = ?', activity[i].id);
      activities.push(buildUserObj(result));
    } else if (activity[i].type == 'task') {
      result = (await dao.Task.db.query(dao.query.communityActivityTaskQuery, [activity[i].id, communityId])).rows;
      activities.push(buildTaskObj(result));
    }
  }
  return activities;
};

module.exports.getTopContributors = function () {
  var topAgencyCreatorsQuery = fs.readFileSync(__dirname + '/sql/getTopAgencyCreators.sql', 'utf8');
  var topAgencyParticipants = fs.readFileSync(__dirname + '/sql/getTopAgencyParticipants.sql', 'utf8');
  var today = new Date();
  var FY = {};
  if (today.getMonth() < 9) {
    FY.start = [today.getFullYear() - 1, 10, 1].join('-');
    FY.end = [today.getFullYear(), 09, 30].join('-');
  } else {
    FY.start = [today.getFullYear(), 10, 1].join('-');
    FY.end = [today.getFullYear() + 1, 09, 30].join('-');
  }
  return new Promise((resolve, reject) => {
    Promise.all([
      db.query(topAgencyCreatorsQuery, [FY.start, FY.end]),
      db.query(topAgencyParticipants, [FY.start, FY.end]),
    ]).then(results => {
      resolve({
        fiscalYear: 'FY' + today.getFullYear().toString().substr(2),
        creators: results[0].rows,
        creatorMax: _.max(results[0].rows.map(row => { return parseInt(row.count); })),
        participants: results[1].rows,
        participantMax: _.max(results[1].rows.map(row => { return parseInt(row.count); })),
      });
    }).catch(reject);
  });
};

module.exports.getTopAgencyContributors = function (agencyId) {
  var topCreatorsQuery = fs.readFileSync(__dirname + '/sql/getTopCreators.sql', 'utf8');
  // var topAgencyParticipants = fs.readFileSync(__dirname + '/sql/getTopAgencyParticipants.sql', 'utf8');
  var today = new Date();
  var FY = {};
  if (today.getMonth() < 9) {
    FY.start = [today.getFullYear() - 1, 10, 1].join('-');
    FY.end = [today.getFullYear(), 09, 30].join('-');
  } else {
    FY.start = [today.getFullYear(), 10, 1].join('-');
    FY.end = [today.getFullYear() + 1, 09, 30].join('-');
  }
  return new Promise((resolve, reject) => {
    Promise.all([
      db.query(topCreatorsQuery, [agencyId, FY.start, FY.end]),
      // db.query(topAgencyParticipants, [FY.start, FY.end]),
    ]).then(results => {
      resolve({
        fiscalYear: 'FY' + today.getFullYear().toString().substr(2),
        creators: results[0].rows,
        creatorMax: _.max(results[0].rows.map(row => { return parseInt(row.count); })),
        // participants: results[1].rows,
        // participantMax: _.max(results[1].rows.map(row => { return parseInt(row.count); })),
      });
    }).catch(reject);
  });
};

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

module.exports.getInteractions = async function () {
  var interactions = {};
  var temp = await dao.Task.db.query(dao.query.postQuery);
  interactions.posts = +temp.rows[0].count;
  temp = await dao.Task.db.query(dao.query.volunteerCountQuery);
  interactions.signups = +temp.rows[0].signups;
  interactions.assignments = +temp.rows[0].assignments;
  interactions.completions = +temp.rows[0].completions;

  return interactions;
};

module.exports.getInteractionsForAgency = async function (agencyId) {
  var interactions = {};
  var temp = await dao.Task.db.query(dao.query.agencyPostQuery, agencyId);
  interactions.posts = +temp.rows[0].count;
  temp = await dao.Task.db.query(dao.query.agencyVolunteerCountQuery, agencyId);
  interactions.signups = +temp.rows[0].signups;
  interactions.assignments = +temp.rows[0].assignments;
  interactions.completions = +temp.rows[0].completions;

  return interactions;
};

module.exports.getInteractionsForCommunity = async function (communityId) {
  var interactions = {};
  var temp = await dao.Task.db.query(dao.query.communityPostQuery, communityId);
  interactions.posts = +temp.rows[0].count;
  temp = await dao.Task.db.query(dao.query.communityVolunteerCountQuery, communityId);
  interactions.signups = +temp.rows[0].signups;
  interactions.assignments = +temp.rows[0].assignments;
  interactions.completions = +temp.rows[0].completions;

  return interactions;
};

module.exports.getUsers = async function (page, filter, sort) {
  var result = {};
  var usersBySortQuery = fs.readFileSync(__dirname + '/sql/getUserListBySort.sql', 'utf8').toString();
  
  if (filter) {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', 'where lower(name) like \'%' + filter.toLowerCase() + '%\' or lower(agency->>\'name\') like \'%' + filter.toLowerCase() + '%\'');
  } else {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', '');
  }

  usersBySortQuery =  usersBySortQuery.replace('[order by]', getUserListOrderByClause(sort));
  result.limit = 25;
  result.page = +page || 1;
  result.users = (await db.query(usersBySortQuery, [page])).rows;
  result.count = result.users.length > 0 ? +result.users[0].full_count : 0;
  result = await this.getUserTaskMetrics (result);
  return result;
};

module.exports.getUsersForAgency = async function (page, filter, sort, agencyId) {
  var result = {};
  var usersBySortQuery = fs.readFileSync(__dirname + '/sql/getUserAgencyListBySort.sql', 'utf8').toString();

  if (filter) {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', 'where lower(name) like \'%' + filter.toLowerCase() + '%\' or lower(agency->>\'name\') like \'%' + filter.toLowerCase() + '%\'');
  } else {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', '');
  }

  usersBySortQuery =  usersBySortQuery.replace('[order by]', getUserListOrderByClause(sort));
  result.limit = 25;
  result.page = +page || 1;
  result.users = (await db.query(usersBySortQuery, [agencyId, page])).rows;
  result.count = result.users.length > 0 ? +result.users[0].full_count : 0;
  result = await this.getUserTaskMetrics (result);
  return result;
};

module.exports.getUsersForCommunity = async function (page, filter, sort, communityId) {
  var result = {};
  var usersBySortQuery = fs.readFileSync(__dirname + '/sql/getUserCommunityListBySort.sql', 'utf8').toString();

  if (filter) {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', 'where lower(name) like \'%' + filter.toLowerCase() + '%\' or lower(agency->>\'name\') like \'%' + filter.toLowerCase() + '%\'');
  } else {
    usersBySortQuery = usersBySortQuery.replace('[where clause]', '');
  }

  usersBySortQuery =  usersBySortQuery.replace('[order by]', getUserListOrderByClause(sort));
  result.limit = 25;
  result.page = +page || 1;
  result.users = (await db.query(usersBySortQuery, [communityId, page])).rows;
  result.count = result.users.length > 0 ? +result.users[0].full_count : 0;
  result = await this.getUserTaskMetrics (result);
  return result;
};

async function getTaskMetrics () {
  var tasks = (await dao.Task.db.query(dao.query.taskStateQuery)).rows[0];
  tasks.totalCreated = Object.values(tasks).reduce((a, b) => { return a + parseInt(b); }, 0);
  tasks.withVolunteers = (await dao.Task.db.query(dao.query.volunteerQuery, 'withVolunteers')).rows[0].count;
  return tasks;
}

async function getUserMetrics () {
  return (await dao.User.db.query(dao.query.userQuery)).rows[0];
}

module.exports.getUserTaskCommunityMetrics = async function (result, communityId) {
  for (var i = 0; i < result.users.length; i++) {
    result.users[i].communityTaskCreated = (await dao.Task.db.query(await dao.query.communityTaskCreatedPerUserQuery, communityId, result.users[i].id)).rows[0].created;
    result.users[i].communityTaskParticipated = (await dao.Task.db.query(await dao.query.communityTaskVolunteerPerUserQuery, communityId, result.users[i].id)).rows[0].participated;
  }
  return result;
};

module.exports.getUserTaskMetrics = async function (result) {
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
};

module.exports.getProfile = async function (id) {
  return await dao.User.findOne('id = ?', id);
};

module.exports.updateProfile = async function (user, done) {
  user.updatedAt = new Date();
  await dao.User.update(user).then(async () => {
    return done(null);
  }).catch (err => {
    return done(err);
  });
};

module.exports.updateCommunityAdmin = async function (user, communityId, done) {
  var communityUser = await dao.CommunityUser.findOne('user_id = ? and community_id = ?', user.id, communityId);
  communityUser.isManager = user.isCommunityAdmin;
  await dao.CommunityUser.update(communityUser).then(async () => {
    return done(null);
  }).catch (err => {
    return done(err);
  });
};

module.exports.getAgency = async function (id) {
  var agency = await dao.Agency.findOne('agency_id = ?', id);
  agency.tasks = (await dao.Task.db.query(dao.query.agencyTaskStateQuery, id)).rows[0];
  agency.tasks.totalCreated = Object.values(agency.tasks).reduce((a, b) => { return a + parseInt(b); }, 0);
  agency.users = (await dao.User.db.query(dao.query.agencyUsersQuery, id)).rows[0];
  return agency;
};

module.exports.getCommunity = async function (id) {
  var community = await communityService.findById(id); //await dao.Community.findOne('community_id = ?', id);
  community.users = (await dao.User.db.query(dao.query.communityUsersQuery, id)).rows[0];
  if (community.duration == 'Cyclical') {
    community.cycles = await dao.Cycle.find('community_id = ?', community.communityId);
    var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getCyclicalCommunityTaskStateTotals.sql', 'utf8');
    var filterState = false;
  } else {
    var filterState = { task_state: 'draft' };
    var taskStateTotalsQuery = fs.readFileSync(__dirname + '/sql/getCommunityTaskStateTotals.sql', 'utf8');
  }
  community.tasks = (await db.query(taskStateTotalsQuery, id)).rows;
  community.totalTasks = _.reject(community.tasks, filterState).reduce((a, b) => { return a + parseInt(b.count); }, 0)
  return community;
};

module.exports.canAdministerAccount = async function (user, id) {
  if (user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, id)) || (user.isCommunityAdmin && await checkCommunity(user, id))) {
    return true;
  }
  return false;
};

module.exports.checkAgency = async function (user, ownerId) {
  var owner = (await dao.User.db.query(dao.query.userAgencyQuery, ownerId)).rows[0];
  if (owner && owner.isAdmin) {
    return false;
  }
  if (owner && owner.name) {
    return _.find(user.tags, { 'type': 'agency' }).name == owner.name;
  }
  return false;
};

module.exports.checkCommunity = async function (user, ownerId) {
  var owner = (await dao.User.db.query(dao.query.userCommunityQuery, ownerId)).rows[0];
  if (owner && owner.isAdmin) {
    return false;
  }
  if (owner && owner.name) {
    return _.find(user.tags, { 'type': 'agency' }).name == owner.name;
  }
  return false;
};

module.exports.getDashboardTaskMetrics = async function (group, filter) {
  var tasks = dao.clean.task(await dao.Task.query(dao.query.taskMetricsQuery, {}, dao.options.taskMetrics));
  var volunteers = (await dao.Volunteer.db.query(dao.query.volunteerTaskQuery)).rows; 
  var generator = new TaskMetrics(tasks, volunteers, group, filter);
  generator.generateMetrics(function (err) {
    if (err) res.serverError(err + ' metrics are unavailable.');
    return null;
  });
  return generator.metrics;
};

module.exports.getDashboardAgencyTaskMetrics = async function (group, filter,agencyId) {
  var tasks = dao.clean.task(await dao.Task.query(dao.query.agencyTaskMetricsQuery, agencyId, dao.options.taskMetrics));
  var volunteers = (await dao.Volunteer.db.query(dao.query.volunteerAgencyTaskQuery,agencyId)).rows;
  var generator = new TaskMetrics(tasks, volunteers, group, filter);
  generator.generateMetrics(function (err) {
    if (err) res.serverError(err + ' metrics are unavailable.');
    return null;
  });
  return generator.metrics;
};

module.exports.getDashboardCommunityTaskMetrics = async function (group, filter,communityId) {
  var tasks = dao.clean.task(await dao.Task.query(dao.query.communityTaskMetricsQuery, communityId, dao.options.taskMetrics));
  var volunteers = (await dao.Volunteer.db.query(dao.query.communityVolunteerTaskQuery,communityId)).rows;
  var generator = new TaskMetrics(tasks, volunteers, group, filter);
  generator.generateMetrics(function (err) {
    if (err) res.serverError(err + ' metrics are unavailable.');
    return null;
  });
  return generator.metrics;
};

module.exports.canChangeOwner = async function (user, taskId) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  var agency = _.find(user.tags, { type: 'agency' });
  return task && (task.restrict.name == agency.name);
};

module.exports.canCommunityChangeOwner = async function (user, taskId) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  if (task && task.communityId) {
    return (await dao.CommunityUser.findOne('user_id = ? and community_id = ?', user.id, task.communityId).catch(() => {
      return {};
    })).isManager;
  } else {
    return false;
  }
};

module.exports.getOwnerOptions = async function (taskId, done) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  if (task) {
    done(await dao.User.query(dao.query.ownerListQuery, task.agencyId));   
  } else {
    done(undefined, 'Unable to locate specified task');
  }
};

module.exports.getCommunityOwnerOptions = async function (taskId, done) {
  var task = await dao.Task.findOne('id = ?', taskId).catch((err) => { 
    return undefined;
  });
  if (task && task.communityId) {
    done(await dao.User.query(dao.query.ownerCommunityListQuery, task.communityId));  
  } else {
    done(undefined, 'Unable to locate specified task');
  }
};

module.exports.changeOwner = async function (ctx, data, done) {
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
      if (task.communityId != null) {
        var share = {
          task_id: data.taskId,
          user_id: data.userId,
          shared_by_user_id: ctx.state.user.id,
          last_modified: new Date,
        };
        db.query('delete from task_share where task_id = ? and user_id = ?', [data.taskId, originalOwner.id]).catch(err => {
          log.info(err);
        });
        dao.TaskShare.insert(share).catch(err => {});
      }
      elasticService.indexOpportunity(task.id);
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
};

module.exports.assignParticipant = async function (ctx, data, done) {
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
};

module.exports.getAgencies = async function () {
  var departments = await dao.Agency.find('code in (select parent_code from agency where parent_code is not null)');
  await Promise.all(departments.map(async (department) => {
    department.agencies = await dao.Agency.find('parent_code = ?', department.code);
  }));
  return departments;
};

module.exports.getCommunities = async function (user) {
  if(user.isAdmin) {
    return await dao.Community.find();
  } else {
    return await dao.Community.query(dao.query.communityListQuery, user.id);
  }
};

module.exports.createAuditLog = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};


