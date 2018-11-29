const _ = require('lodash');
const dao = require('postgres-gen-dao');
const moment = require('moment');
const util = require('util');

const tasksDueQuery = 'select task.* ' +
  'from task ' +
  'where "completedBy"::date - ?::date = 0 and state = ? ';

const tasksDueDetailQuery = 'select owner.name, owner.username, owner.bounced ' +
  'from task join midas_user owner on task."userId" = owner.id ' +
  'where task.id = ? ';

const taskQuery = 'select @task.*, @tags.*, @owner.id, @owner.name, @owner.photoId ' +
  'from @task task ' +
  'join @midas_user owner on owner.id = task."userId" ' +
  'left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id ' +
  'left join @tagentity tags on tags.id = task_tags.tagentity_tasks ';

const userQuery = 'select @midas_user.*, @agency.* ' +
  'from @midas_user midas_user ' +
  'left join @agency on agency.agency_id = midas_user.agency_id  ' +
  'where midas_user.id = ? ';

const communityUserQuery = 'select * from community_user '+
'inner join community on community_user.community_id = community.community_id ' + 
'where community_user.user_id = ?';

const communitiesQuery = 'SELECT ' +
    'community.community_id, ' +
    'community.community_name, ' +
    'community.target_audience ' +
  'FROM community ' +
  'WHERE ' +
    'community.is_closed_group = false ' +
  'UNION ' +
  'SELECT ' +
    'community.community_id, ' +
    'community.community_name, ' +
    'community.target_audience ' +
  'FROM community ' +
  'JOIN community_user ' +
    'ON community_user.community_id = community.community_id ' +
  'WHERE ' +
    'community.is_closed_group = true ' +
    'AND community_user.user_id = ?';

const userTasksQuery = 'select count(*) as "completedTasks", midas_user.id, ' +
  'midas_user.username, midas_user.name, midas_user.bounced ' +
  'from midas_user ' +
  'join volunteer v on v."userId" = midas_user.id ' +
  'join task t on t.id = v."taskId" and t."completedAt" is not null ' +
  'where midas_user.id in ? ' +
  'group by midas_user.id, midas_user.username, midas_user.name';

const volunteerQuery = 'select volunteer.id, volunteer."userId", volunteer.assigned, ' +
  'volunteer."taskComplete", midas_user.name, midas_user.username, midas_user.bounced, midas_user."photoId" ' +
  'from volunteer ' +
  'join midas_user on midas_user.id = volunteer."userId" ' +
  'where volunteer."taskId" = ?';

const volunteerListQuery = 'select midas_user.username, midas_user."photoId", midas_user.bounced, volunteer."taskComplete" ' +
  'from volunteer ' +
  'join midas_user on midas_user.id = volunteer."userId" ' +
  'where volunteer."taskId" = ? and volunteer.assigned = true';

const commentsQuery = 'select @comment.*, @user.* ' +
  'from @comment comment ' +
  'join @midas_user "user" on "user".id = comment."userId" ' +
  'where comment."taskId" = ?';

const deleteTaskTags = 'delete from tagentity_tasks__task_tags where task_tags = ?';

const taskExportQuery = 'select task.id, task.title, description, task."createdAt", task."publishedAt", task."assignedAt", ' +
  'task."submittedAt", midas_user.name as creator_name, ' +
  '(' +
    'select count(*) ' +
    'from volunteer where "taskId" = task.id' +
  ') as signups, ' +
  'task.state, ' +
  '(' +
    'select tagentity.name ' +
    'from tagentity inner join tagentity_users__user_tags tags on tagentity.id = tags.tagentity_users ' +
    'where tags.user_tags = task."userId" and tagentity.type = ? ' +
    'limit 1' +
  ') as agency_name, task."completedAt" ' +
  'from task inner join midas_user on task."userId" = midas_user.id ';

var exportFormat = {
  'task_id': 'id',
  'name': {field: 'title', filter: nullToEmptyString},
  'description': {field: 'description', filter: nullToEmptyString},
  'created_date': {field: 'createdAt', filter: excelDateFormat},
  'published_date': {field: 'publishedAt', filter: excelDateFormat},
  'assigned_date': {field: 'assignedAt', filter: excelDateFormat},
  'submitted_date': {field: 'submittedAt', filter: excelDateFormat},
  'creator_name': {field: 'creator_name', filter: nullToEmptyString},
  'signups': 'signups',
  'task_state': 'state',
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
      agency: '',
      tags: [],
    },
    exclude: {
      task: [ 'deletedAt' ],
      tags: [ 'deletedAt' ],
    },
  },
  user: {
    fetch: {
      agency: '',
    },
    exclude: {
      midas_user: [ 'deletedAt', 'passwordAttempts', 'isAdmin', 'isAgencyAdmin', 'disabled', 'bio',
        'createdAt', 'title', 'updatedAt' ],
    },
  },
  comment: {
    fetch: {
      user: '',
    },
    exclude: {
      comment: [ 'deletedAt' ],
      user: [
        'title', 'bio', 'isAdmin', 'disabled', 'passwordAttempts',
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin',
      ],
    },
  },
  taskVolunteer: {
    fetch: {
      user: '',
    },
  },
};

const clean = {
  tasks: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      return cleaned;
    });
  },
  task: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    return cleaned;
  },
  user: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    cleaned.agency = _.pickBy(cleaned.agency, _.identity);
    if (typeof cleaned.agency == 'undefined') {
      delete(cleaned.agency);
    }
    return cleaned;
  },
  comments: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.user = _.pickBy(cleaned.user, _.identity);
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    Agency: dao({ db: db, table: 'agency'}),
    Task: dao({ db: db, table: 'task' }),
    User: dao({ db: db, table: 'midas_user' }),
    TaskTags: dao({ db: db, table: 'tagentity_tasks__task_tags' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    Comment: dao({ db: db, table: 'comment' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    query: {
      task: taskQuery,
      user: userQuery,
      volunteer: volunteerQuery,
      comments: commentsQuery,
      deleteTaskTags: deleteTaskTags,
      taskExportQuery: taskExportQuery,
      volunteerListQuery: volunteerListQuery,
      userTasks: userTasksQuery,
      tasksDueQuery: tasksDueQuery,
      tasksDueDetailQuery: tasksDueDetailQuery,
      communityUserQuery: communityUserQuery,
      communitiesQuery: communitiesQuery,
    },
    options: options,
    clean: clean,
    exportFormat: exportFormat,
  };
};
