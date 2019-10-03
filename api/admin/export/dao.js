const _ = require('lodash');
const dao = require('postgres-gen-dao');
const moment = require('moment');
const util = require('util');

const exportUserData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.id, m_user.name, m_user.username, m_user.title, m_user.bio, ' +
  'm_user."isAdmin", m_user.disabled, tagentity.name as location, agency.name as agency ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'ORDER BY m_user.id';

const exportUserAgencyData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.id, m_user.name, m_user.username, m_user.title, m_user.bio, ' +
  'm_user."isAdmin", m_user.disabled, tagentity.name as location, agency.name as agency ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'WHERE m_user.agency_id = ? ORDER BY m_user.id';

const exportUserCommunityData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.id, m_user.name, m_user.username, m_user.title, m_user.bio, ' +
  'm_user."isAdmin", m_user.disabled, tagentity.name as location, agency.name as agency ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'LEFT JOIN community_user ON community_user.user_id = m_user.id ' + 
  'WHERE community_user.community_id = ? ORDER BY m_user.id';

  const exportTaskData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
  'task."submittedAt", midas_user.name as creator_name, ' +
  '(' +
    'select count(*) ' +
    'from volunteer where "taskId" = task.id' +
  ') as applicants, ' +
  '(' +
    'select string_agg(midas_user.name, \', \') ' +
    'from volunteer ' +
    'inner join midas_user on midas_user.id = volunteer."userId" ' +
    'where "taskId" = task.id ' +
  ') as selected_participants, ' +
  '(' +
    'select string_agg(midas_user.name, \', \') ' +
    'from volunteer ' +
    'inner join midas_user on midas_user.id = volunteer."userId" ' +
    'where "taskId" = task.id and volunteer."taskComplete" = true ' +
  ') as completed_participants, ' +
  'task.state, ' +
  'agency.name as agency_name, task."completedAt" ' +
  'from task inner join midas_user on task."userId" = midas_user.id ' +
  'left join agency on task.agency_id = agency.agency_id ';

const exportTaskAgencyData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
  'task."submittedAt", midas_user.name as creator_name, ' +
  '(' +
    'select count(*) ' +
    'from volunteer where "taskId" = task.id' +
  ') as signups, ' +
  'task.state, ' +
  'agency.name as agency_name, task."completedAt" ' +
  'from task inner join midas_user on task."userId" = midas_user.id ' +
  'left join agency on task.agency_id = agency.agency_id ' + 
  'where task.agency_id = ?';

const exportTaskCommunityData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
  'task."submittedAt", midas_user.name as creator_name, ' +
  '(' +
    'select count(*) ' +
    'from volunteer where "taskId" = task.id' +
  ') as signups, ' +
  'task.state, ' +
  'agency.name as agency_name, task."completedAt" ' +
  'from task ' +
  'inner join midas_user on task."userId" = midas_user.id ' + 
  'left join agency on task.agency_id = agency.agency_id ' +
  'where task.community_id = ?  order by task."createdAt" desc';

var exportUserFormat = {
  'user_id': 'id',
  'name': {field: 'name', filter: nullToEmptyString},
  'username': {field: 'username', filter: nullToEmptyString},
  'title': {field: 'title', filter: nullToEmptyString},
  'agency': {field: 'agency', filter: nullToEmptyString},
  'location': {field: 'location', filter: nullToEmptyString},
  'bio': {field: 'bio', filter: nullToEmptyString},
  'admin': 'isAdmin',
  'manager': 'is_manager',
  'disabled': 'disabled',
  'announcement': {field: 'content', filter: nullToEmptyString},
};

var exportTopContributorCreatedFormat = {
  'Rank': {field: 'rank', filter: nullToEmptyString},
  'Agency': {field: 'name', filter: nullToEmptyString},
  'Total Number Created': {field: 'count', filter: nullToEmptyString},
};

var exportTopContributorParticipantFormat = {
  'Rank': {field: 'rank', filter: nullToEmptyString},
  'Agency': {field: 'name', filter: nullToEmptyString},
  'Total Number Participated': {field: 'count', filter: nullToEmptyString},
};

var exportTopContributorAgencyCreatedFormat = {
  'Rank': {field: 'rank', filter: nullToEmptyString},
  'Creator': {field: 'name', filter: nullToEmptyString},
  'Total Number Created': {field: 'count', filter: nullToEmptyString},
};

var exportTopContributorAgencyParticipantFormat = {
  'Rank': {field: 'rank', filter: nullToEmptyString},
  'Participant': {field: 'name', filter: nullToEmptyString},
  'Total Number Participated': {field: 'count', filter: nullToEmptyString},
};

var exportTaskFormat = {
  'task_id': 'id',
  'title': {field: 'title', filter: nullToEmptyString},
  'description': {field: 'description', filter: nullToEmptyString},
  'created_date': {field: 'createdAt', filter: excelDateFormat},
  'published_date': {field: 'publishedAt', filter: excelDateFormat},
  'assigned_date': {field: 'assignedAt', filter: excelDateFormat},
  'submitted_date': {field: 'submittedAt', filter: excelDateFormat},
  'creator_name': {field: 'creator_name', filter: nullToEmptyString},
  'applicants': 'applicants',
  'selected_participants': {field: 'selected_participants', filter: nullToEmptyString},
  'completed_participants': {field: 'completed_participants', filter: nullToEmptyString},
  'task_state': 'state',
  'bureau': {field: 'bureau', filter: nullToEmptyString},
  'office': {field: 'office', filter: nullToEmptyString},
  'agency_name': {field: 'agency_name', filter: nullToEmptyString},
  'completion_date': {field: 'completedAt', filter: excelDateFormat},
};


function nullToEmptyString (str) {
  return str ? str : '';
}

function excelDateFormat (date) {
  return date != null ? moment(date).format('YYYY-MM-DD HH:mm:ss') : '';
}

const options = {
  task: {
    fetch: {
      owner: '',
      volunteers: [],
    },
    exclude: {
      task: [ 'projectId', 'description', 'userId', 'updatedAt', 'deletedAt', 'publishedAt', 'assignedAt',
        'completedAt', 'completedBy', 'submittedAt', 'restrict' ],
      owner: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin' ],
      volunteers: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin' ],
    },
  },
  
  user: {
    fetch: {
      tags: [],
    },
    exclude: {
      m_user: ['username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin'],
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ],
    },
  },
};

const clean = {
  task: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      return cleaned;
    });
  },
  users: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function (tag) {
        return _.pickBy(tag, _.identity);
      });
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    Task: dao({ db: db, table: 'task' }),
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    query: {
      exportUserData: exportUserData,
      exportUserAgencyData: exportUserAgencyData,
      exportUserCommunityData: exportUserCommunityData,
      exportTaskAgencyData: exportTaskAgencyData,
      exportTaskCommunityData: exportTaskCommunityData,
      exportTaskData: exportTaskData,    
    },
    clean: clean,
    options: options,
    exportUserFormat: exportUserFormat,
    exportTaskFormat: exportTaskFormat,
    exportTopContributorCreatedFormat: exportTopContributorCreatedFormat,
    exportTopContributorParticipantFormat: exportTopContributorParticipantFormat,
    exportTopContributorAgencyCreatedFormat: exportTopContributorAgencyCreatedFormat,
    exportTopContributorAgencyParticipantFormat: exportTopContributorAgencyParticipantFormat,
  };
};