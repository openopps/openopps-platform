const _ = require('lodash');
const dao = require('postgres-gen-dao');
const badgeDescriptions = require('../../utils').badgeDescriptions;

const userByAgencyQuery = 'select @midas_user.*, @agency.* '+
'from @midas_user midas_user ' +
 'join @agency on agency.agency_id = midas_user.agency_id '+
 'where midas_user.id <> ? and midas_user.agency_id=?' +
'order by midas_user."createdAt" desc ' +
'limit 2';

const userByTitleQuery = 'select @midas_user.*, @agency.* ' +
'from @midas_user midas_user ' +
'left join tagentity_users__user_tags user_tags on user_tags.user_tags = midas_user.id ' +
'left join @tagentity agency on agency.id = user_tags.tagentity_users and agency.type = \'agency\' ' +
'where midas_user.id <> ? and trim(midas_user.title) = trim(?) ';

const taskQuery = 'select count(*) as count ' +
'from task ' +
'where state = ? ';

const taskByTypeQuery = 'select tag.name, tag.id, count(*) ' +
  'from tagentity tag ' +
  'join tagentity_tasks__task_tags task_tags on task_tags.tagentity_tasks = tag.id ' +
  'join task on task.id = task_tags.task_tags ' +
  'where type = ? and (task.state = \'open\' or (task.state = \'in progress\' and task.accepting_applicants)) ' +
  'group by tag.name, tag.id ' +
  'order by count(*) desc ' +
  'limit ?';

const taskHistoryQuery = 'select @task.* ' +
'from @task task ' +
'where state = ? ' +
'order by task."completedAt" desc ' +
'limit 6 ';

const participantsQuery = 'select @m_user.* ' +
'from @midas_user m_user left join volunteer on m_user.id = volunteer."userId" ' +
'where volunteer."taskComplete" = true and volunteer."taskId" = ? ';

const badgeQuery = 'select badge.*, @user.* ' +
'from badge inner join @midas_user "user" on badge.user = "user".id ' +
'where badge.task = ? ';

const communitiesTasksQuery = 'SELECT community.community_id, community.community_name, community.target_audience ,community.reference_id, COUNT(task.id) as taskCount ' + 
'FROM community JOIN task  ON community.community_id = task.community_id where community.target_audience <> 2 and (task.state =\'open\' or (task.state = \'in progress\' and task.accepting_applicants)) '+
'group by community.community_name, community.community_id ' +
'order by taskCount desc ' +
'limit 5 ' ;

const options = {
  user: {
    fetch: {
      agency: '',
    },
    exclude: {
      midas_user: [ 'bio', 'completedTasks', 'passwordAttempts', 'createdAt', 'disabled', 'isAdmin', 'isAgencyAdmin', 'updatedAt', 'username' ],
    },
  },
  taskHistory: {
    exclude: {
      task: [ 'createdAt', 'state', 'description', 'assignedAt', 'completedAt', 'completedBy', 'publishedAt', 'submittedAt', 'updatedAt' ],
    },
  },
  badge: {
    fetch: {
      user: '',
    },
    exclude: {
      user: [ 'bio', 'completedTasks', 'passwordAttempts', 'createdAt', 'disabled', 'isAdmin', 'isAgencyAdmin', 'updatedAt', 'username' ],
    },
  },
  participants: {
    exclude: {
      m_user: [ 'bio', 'completedTasks', 'passwordAttempts', 'createdAt', 'disabled', 'isAdmin', 'isAgencyAdmin', 'updatedAt', 'username' ],
    },
  },
};

const clean = {
  taskHistory: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
      delete(cleaned.userId);
      return cleaned;
    });
  },
  badge: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.description = badgeDescriptions[record.type];
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    Community : dao({ db: db, table: 'community' }),
    query: {
      userByAgency: userByAgencyQuery,
      userByTitle: userByTitleQuery,
      task: taskQuery,
      taskHistoryQuery: taskHistoryQuery,
      participantsQuery: participantsQuery,
      badgeQuery: badgeQuery,
      taskByType: taskByTypeQuery,
      communitiesTasks :communitiesTasksQuery,
    },
    options: options,
    clean: clean,
  };
};
