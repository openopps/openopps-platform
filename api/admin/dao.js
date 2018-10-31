const _ = require('lodash');
const dao = require('postgres-gen-dao');

const taskQuery = 'select count(*) as count from task ';

const taskStateQuery = 'select ' +
  'sum(case when state = \'submitted\' then 1 else 0 end) as "submitted", ' +
  'sum(case when state in (\'open\', \'in progress\') and "accepting_applicants" then 1 else 0 end) as "open", ' +
  'sum(case when state = \'not open\' then 1 else 0 end) as "notOpen", ' +
  'sum(case when state = \'in progress\' and not "accepting_applicants" then 1 else 0 end) as "inProgress", ' +
  'sum(case when state = \'completed\' then 1 else 0 end) as "completed", ' +
  'sum(case when state = \'canceled\' then 1 else 0 end) as "canceled" ' +
  'from task';

const agencyTaskStateQuery = 'select ' +
  'sum(case when state = \'submitted\' then 1 else 0 end) as "submitted", ' +
  'sum(case when state in (\'open\', \'in progress\') and "accepting_applicants" then 1 else 0 end) as "open", ' +
  'sum(case when state = \'not open\' then 1 else 0 end) as "notOpen", ' +
  'sum(case when state = \'in progress\' and not "accepting_applicants" then 1 else 0 end) as "inProgress", ' +
  'sum(case when state = \'completed\' then 1 else 0 end) as "completed", ' +
  'sum(case when state = \'canceled\' then 1 else 0 end) as "canceled" ' +
  'from task where lower(restrict->>\'name\') = ?';

const communityTaskStateQuery = 'select ' +
  'sum(case when state = \'submitted\' then 1 else 0 end) as "submitted", ' +
  'sum(case when state in (\'open\', \'in progress\') and "accepting_applicants" then 1 else 0 end) as "open", ' +
  'sum(case when state = \'not open\' then 1 else 0 end) as "notOpen", ' +
  'sum(case when state = \'in progress\' and not "accepting_applicants" then 1 else 0 end) as "inProgress", ' +
  'sum(case when state = \'completed\' then 1 else 0 end) as "completed", ' +
  'sum(case when state = \'canceled\' then 1 else 0 end) as "canceled" ' +
  'from task where community_id = ?';

const volunteerQuery = 'select count(*) as count from task where exists (select 1 from volunteer where task.id = volunteer."taskId") ';

const userQuery = 'select ' +
  'count(*) as "total", ' +
  'sum(case when disabled = \'f\' then 1 else 0 end) as "active", ' +
  'sum(case when "isAdmin" then 1 else 0 end) as "admins" ' +
  'from midas_user';

const agencyUsersQuery = 'select ' +
  'count(*) as "total", ' +
  'sum(case when disabled = \'f\' then 1 else 0 end) as "active", ' +
  'sum(case when "isAgencyAdmin" then 1 else 0 end) as "admins" ' +
  'from midas_user ' + 
  'join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
  'join tagentity tag on tags.tagentity_users = tag.id ' +
  'where tag.type = \'agency\' and tag.id = ?';

const communityUsersQuery = 'select ' +
  'count(*) as "total", ' +
  'sum(case when disabled = \'f\' then 1 else 0 end) as "active", ' +
  'sum(case when disabled= \'f\' and "is_manager" then 1 else 0 end) as "admins" ' +
  'from community_user ' +
  'join midas_user on midas_user.id = user_id ' +
  'where community_id = ?';

const taskCommunityStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'where community_id= ? and ';

const communityTaskQuery = 'select count(*) from task where "community_id" = ? ';

const withTasksQuery = 'select count(distinct "userId") from task ';

const taskHistoryQuery = 'select "assignedAt", "completedAt", "createdAt", "publishedAt", "submittedAt" from task' ;

const postQuery = 'select count(*) from comment ';

const communityPostQuery = 'select count(*) from comment ' +
'join task on comment."taskId" = task.id ' +
'where task.community_id = ?';

const volunteerCountQuery = 'select ' +
    'count(*) as signups, ' +
    'sum(case when assigned then 1 else 0 end) as assignments, ' +
    'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer';

const communityVolunteerCountQuery = 'select ' +
  'count(*) as signups, ' +
  'sum(case when assigned then 1 else 0 end) as assignments, ' +
  'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer join task on task.id = volunteer."taskId" ' +
  'where task.community_id = ?';

const userListQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const ownerListQuery = 'select midas_user.id, midas_user.name ' +
'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
'inner join tagentity tag on tags.tagentity_users = tag.id ' +
"where midas_user.disabled = false and tag.type = 'agency' and tag.name = ?";

const userAgencyListQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
  'inner join tagentity tag on tags.tagentity_users = tag.id ' +
  "where tag.type = 'agency' and lower(tag.name) = ? " +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const ownerCommunityListQuery ='select midas_user.id,midas_user.name ' +
'from midas_user inner join community_user on midas_user.id= community_user.user_Id ' ;
 

const userListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'where lower(username) like ? or lower(name) like ? ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userAgencyListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
  'inner join tagentity tag on tags.tagentity_users = tag.id ' +
  "where (lower(username) like ? or lower(midas_user.name) like ?) and tag.type = 'agency' and lower(tag.name) = ? " +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userTaskState = 'select state from task where "userId" = ? ';

const participantTaskState = 'select task.state from task inner join volunteer on volunteer."taskId" = task.id where volunteer."userId" = ? ';

const exportUserData = 'select m_user.id, m_user.name, m_user.username, m_user.title, ' +
  'm_user.bio, m_user."isAdmin", m_user.disabled, ' +
  '(' +
    'select tagentity.name ' +
    'from tagentity_users__user_tags left join tagentity on tagentity_users__user_tags.tagentity_users = tagentity.id ' +
    "where tagentity_users__user_tags.user_tags = m_user.id and type = 'location' " +
    'limit 1' +
  ') as location, ' +
  '(' +
    'select tagentity.name ' +
    'from tagentity_users__user_tags left join tagentity on tagentity_users__user_tags.tagentity_users = tagentity.id ' +
    "where tagentity_users__user_tags.user_tags = m_user.id and type = 'agency' " +
    'limit 1' +
  ') as agency ' +
  'from midas_user m_user ';

const taskStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'where ';

const taskAgencyStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  "where lower(restrict->>'name') = ? and ";

const activityQuery = 'select comment."createdAt", comment.id, ' + "'comment' as type " + '' +
  'from midas_user ' +
  'inner join comment on midas_user.id = comment."userId" ' +
  'inner join task on comment."taskId" = task.id ' +
  'union all ' +
  'select volunteer."createdAt", volunteer.id, ' + "'volunteer' as type " + '' +
  'from volunteer ' +
  'inner join midas_user on midas_user.id = volunteer."userId" ' +
  'inner join task on volunteer."taskId" = task.id ' +
  'union all ' +
  'select "createdAt", id, ' + "'user' as type " + '' +
  'from midas_user ' +
  'union all ' +
  'select task."createdAt", task.id, ' + "'task' as type " + '' +
  'from task ' +
  'inner join midas_user on midas_user.id = task."userId" ' +
  'order by "createdAt" desc ' +
  'limit 10';

const activityCommentQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", comment.value, comment."createdAt" ' +
  'from midas_user ' +
  'inner join comment on midas_user.id = comment."userId" ' +
  'left join task on comment."taskId" = task.id ' +
  'where comment.id = ? ';

const activityVolunteerQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", volunteer."createdAt" ' +
  'from volunteer ' +
  'left join midas_user on midas_user.id = volunteer."userId" ' +
  'left join task on volunteer."taskId" = task.id ' +
  'where volunteer.id = ? ';

const activityTaskQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", task."createdAt" ' +
  'from midas_user ' +
  'inner join task on midas_user.id = task."userId" ' +
  'where task.id = ? ';

const taskMetricsQuery = 'select @task.*, @tags.* ' +
  'from @task task ' +
  'left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id ' +
  'left join @tagentity tags on tags.id = task_tags.tagentity_tasks ';

const volunteerDetailsQuery = 'select @m_user.*, @tags.* ' +
  'from @midas_user m_user ' +
  'inner join volunteer on m_user.id = volunteer."userId" ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ' +
  "where tags.type = 'agency' ";

const userAgencyQuery = 'select tagentity.name, midas_user."isAdmin" ' +
  'from midas_user inner join tagentity_users__user_tags on midas_user.id = tagentity_users__user_tags.user_tags ' +
  'inner join tagentity tagentity on tagentity.id = tagentity_users__user_tags.tagentity_users ' +
  'where midas_user.id = ? ' +
  "and tagentity.type = 'agency' ";

var exportFormat = {
  'user_id': 'id',
  'name': {field: 'name', filter: nullToEmptyString},
  'username': {field: 'username', filter: nullToEmptyString},
  'title': {field: 'title', filter: nullToEmptyString},
  'agency': {field: 'agency', filter: nullToEmptyString},
  'location': {field: 'location', filter: nullToEmptyString},
  'bio': {field: 'bio', filter: nullToEmptyString},
  'admin': 'isAdmin',
  'disabled': 'disabled',
  'announcement': {field: 'content', filter: nullToEmptyString},
};

function nullToEmptyString (str) {
  return str ? str : '';
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
  taskMetrics: {
    fetch: {
      tags: [],
    },
    exclude: {
      task: [ 'deletedAt' ],
      tags: [ 'deletedAt' ],
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
    Volunteer: dao({ db: db, table: 'volunteer' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    query: {
      taskQuery: taskQuery,
      taskStateQuery: taskStateQuery,
      agencyTaskStateQuery: agencyTaskStateQuery,
      communityTaskStateQuery: communityTaskStateQuery,
      volunteerQuery: volunteerQuery,
      userQuery: userQuery,
      agencyUsersQuery: agencyUsersQuery,
      communityUsersQuery: communityUsersQuery,
      withTasksQuery: withTasksQuery,
      taskHistoryQuery: taskHistoryQuery,
      postQuery: postQuery,
      communityPostQuery: communityPostQuery,
      volunteerCountQuery: volunteerCountQuery,
      communityVolunteerCountQuery: communityVolunteerCountQuery,
      userListQuery: userListQuery,
      ownerListQuery: ownerListQuery,
      userAgencyListQuery: userAgencyListQuery,
      userListFilteredQuery: userListFilteredQuery,
      userAgencyListFilteredQuery: userAgencyListFilteredQuery,
      userTaskState: userTaskState,
      participantTaskState: participantTaskState,
      exportUserData: exportUserData,
      taskStateUserQuery: taskStateUserQuery,
      taskAgencyStateUserQuery: taskAgencyStateUserQuery,
      activityQuery: activityQuery,
      activityCommentQuery: activityCommentQuery,
      activityVolunteerQuery: activityVolunteerQuery,
      activityTaskQuery: activityTaskQuery,
      taskMetricsQuery: taskMetricsQuery,
      volunteerDetailsQuery: volunteerDetailsQuery,
      userAgencyQuery: userAgencyQuery,
      taskCommunityStateUserQuery:taskCommunityStateUserQuery,
      ownerCommunityListQuery:ownerCommunityListQuery,
    },
    clean: clean,
    options: options,
    exportFormat: exportFormat,
  };
};