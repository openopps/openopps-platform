const _ = require('lodash');
const dao = require('postgres-gen-dao');
const moment = require('moment');
const util = require('util');

const exportUserData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.name, m_user.hiring_path, m_user.username as logingov_email, ' +
  'm_user.government_uri as official_federal_govt_email, m_user.last_login as last_login, ' +
  'm_user."createdAt" as account_create, m_user.title, agency.name as agency, ' +
  'tagentity.name as location, m_user.bio, m_user."isAdmin", m_user.disabled ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'ORDER BY m_user.id desc';

const exportUserAgencyData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.name, m_user.hiring_path, m_user.username as logingov_email, ' +
  'm_user.government_uri as official_federal_govt_email, m_user.last_login as last_login, ' +
  'm_user."createdAt" as account_create, m_user.title, agency.name as agency, ' +
  'tagentity.name as location, m_user.bio, m_user."isAgencyAdmin" as "isAdmin", m_user.disabled ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'WHERE m_user.agency_id = ? ORDER BY m_user.id desc';

const exportUserCommunityData = 'SELECT ' +
  'DISTINCT ON (m_user.id) m_user.name, m_user.hiring_path, m_user.username as logingov_email, ' +
  'm_user.government_uri as official_federal_govt_email, m_user.last_login as last_login, ' +
  'm_user."createdAt" as account_create, community_user.created_at as "joined_community", m_user.title, agency.name as agency, ' +
  'tagentity.name as location, m_user.bio, community_user.is_manager as "isAdmin", m_user.disabled ' +
  'FROM midas_user m_user ' +
  'LEFT JOIN agency ON agency.agency_id = m_user.agency_id ' +
  'LEFT JOIN tagentity_users__user_tags ON tagentity_users__user_tags.user_tags = m_user.id ' +
  'LEFT JOIN tagentity ON tagentity_users__user_tags.tagentity_users = tagentity.id AND tagentity.type = \'location\' ' +
  'LEFT JOIN community_user ON community_user.user_id = m_user.id ' + 
  'WHERE community_user.community_id = ? ORDER BY m_user.id desc';

const exportTaskData = 'select task.id, task.title, task.description, task."createdAt", task."publishedAt", task."assignedAt", ' +
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
  'agency.name as agency_name, community.community_name, task."completedAt" ' +
  'from task inner join midas_user on task."userId" = midas_user.id ' +
  'left join agency on task.agency_id = agency.agency_id ' +
  'left join community on task.community_id = community.community_id ' +
  'where task.state <> \'archived\' and (community.target_audience is null or community.target_audience <> 2) ';

const exportTaskAgencyData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
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
  'left join agency on task.agency_id = agency.agency_id ' + 
  'where task.state <> \'archived\' and task.community_id is null and task.agency_id = ?';

const exportTaskCommunityData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
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
  ') as completed_participants,  ' +
  'task.state,  ' +
  'agency.name as agency_name, ' +
  '(' +
    'select bureau.name ' +
    'from bureau where bureau.bureau_id = task.bureau_id ' +
  ') as bureau, ' +
  '(' +
    'select office.name ' +
    'from office where office.office_id = task.office_id ' +
  ') as office, ' +
  'agency.name as agency_name, task."completedAt" ' +
  'from task ' +
  'inner join midas_user on task."userId" = midas_user.id ' + 
  'left join agency on task.agency_id = agency.agency_id ' +
  'where task.community_id = ? order by task."createdAt" desc';

const exportTaskDoSCommunityData = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
  'task."submittedAt", midas_user.name as creator_name, ' +
  '( ' +
    'select count(application_task.task_id) ' +
    'from application_task ' +
    'join application on application_task.application_id = application.application_id ' +
    'where application_task.task_id = task.id and application_task.sort_order <> -1 and application.submitted_at is not null ' +
  ') as applicants, ' +
  '(' +
    'select string_agg(trim(midas_user.given_name || \' \' || midas_user.last_name), \', \') ' +
    'from application ' +
    'inner join task_list_application tla on application.application_id = tla.application_id ' +
    'inner join task_list on tla.task_list_id = task_list.task_list_id ' +
    'inner join midas_user on application.user_id = midas_user.id ' +
    'where task_list.task_id = task.id and task_list.title in (\'Primary\', \'Alternate\') ' +
  ') as selected_participants, ' +
  '(' +
    'select string_agg(trim(midas_user.given_name || \' \' || midas_user.last_name), \', \') ' +
    'from application ' +
    'inner join midas_user on application.user_id = midas_user.id ' +
    'where application.internship_completed = task.id ' +
  ') as completed_participants, ' +
  'task.state,  ' +
  'agency.name as agency_name, ' +
  '(' +
    'select bureau.name ' +
    'from bureau where bureau.bureau_id = task.bureau_id ' +
  ') as bureau, ' +
  '(' +
    'select office.name ' +
    'from office where office.office_id = task.office_id ' +
  ') as office, ' +
  'agency.name as agency_name, task."completedAt" ' +
  'from task ' +
  'inner join midas_user on task."userId" = midas_user.id ' + 
  'left join agency on task.agency_id = agency.agency_id ' +
  'left join cycle on task.cycle_id = cycle.cycle_id ' +
  'where task.community_id = ? and cycle.cycle_id = ? order by task."createdAt" desc';

var exportUserFormat = {
  'name': {field: 'name', filter: nullToEmptyString},
  'hiring_path': 'hiring_path',
  'logingov_email': 'logingov_email',
  'official_federal_govt_email': {field: 'official_federal_govt_email', filter: nullToEmptyString},
  'last_login': {field: 'last_login', filter: nullToEmptyString},
  'account_create': 'account_create',
  'joined_community': 'joined_community',
  'title': {field: 'title', filter: nullToEmptyString},
  'agency': {field: 'agency', filter: nullToEmptyString},
  'location': {field: 'location', filter: nullToEmptyString},
  'bio': {field: 'bio', filter: nullToEmptyString},
  'admin': 'isAdmin',
  'disabled': 'disabled',
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
  'community_name': {field: 'community_name', filter: nullToEmptyString},
  'completion_date': {field: 'completedAt', filter: excelDateFormat},
};
var exportCycleTaskFormat = {
  'Cycle Name':{field: 'name', filter: nullToEmptyString},
  'Total created': {field: 'totalcreated', filter: nullToEmptyString},
  'Submitted': {field: 'submitted', filter: nullToEmptyString},
  'Approved': {field: 'approved', filter: nullToEmptyString},
  'Open': {field: 'open', filter: nullToEmptyString},
  'Completed' :{field:'completed',filter:nullToEmptyString},

};
var exportCycleInteractionsFormat = {
  'Cycle Name':{field: 'name', filter: nullToEmptyString},
  'Applications submitted': {field: 'submittedTotal', filter: nullToEmptyString},
  'Applications on Next Steps': {field: 'step0NextStepTotal', filter: nullToEmptyString},
  'Applications on step 1 - Select Internships': {field: 'step1SelectInternshipTotal', filter: nullToEmptyString},
  'Applications on step 2 - Experiences & References': {field: 'step2ExpRefTotal', filter: nullToEmptyString},
  'Applications on step 3 - Education & Transcript' :{field:'step3EducationTotal',filter:nullToEmptyString},
  'Applications on step 4 - Languages & Skills' :{field:'step4LanguageTotal',filter:nullToEmptyString},
  'Applications on step 5 - Statement of interest' :{field:'step5StatementTotal',filter:nullToEmptyString},
  'Applications on step 6 - Review application' :{field:'step6ReviewTotal',filter:nullToEmptyString},
  'Total completed' :{field:'InternshipCompleteTotal', filter:nullToEmptyString},
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
      exportTaskDoSCommunityData: exportTaskDoSCommunityData,
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
    exportCycleTaskFormat:exportCycleTaskFormat,
    exportCycleInteractionsFormat:exportCycleInteractionsFormat,

  };
};