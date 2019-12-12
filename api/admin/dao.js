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
  'from task left join community on task.community_id = community.community_id ' +
  'where community.target_audience <> 2 or community.target_audience is null';

const agencyTaskStateQuery = 'select ' +
  'sum(case when state = \'submitted\' then 1 else 0 end) as "submitted", ' +
  'sum(case when state in (\'open\', \'in progress\') and "accepting_applicants" then 1 else 0 end) as "open", ' +
  'sum(case when state = \'not open\' then 1 else 0 end) as "notOpen", ' +
  'sum(case when state = \'in progress\' and not "accepting_applicants" then 1 else 0 end) as "inProgress", ' +
  'sum(case when state = \'completed\' then 1 else 0 end) as "completed", ' +
  'sum(case when state = \'canceled\' then 1 else 0 end) as "canceled" ' +
  'from task '  +
  'where community_id is null ' +
  'and agency_id = ? ';

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
  'from midas_user where agency_id = ?';

const communityUsersQuery = 'select ' +
  'count(*) as "total", ' +
  'sum(case when (midas_user.disabled = \'f\' and community_user.disabled =\'f\') then 1 else 0 end) as "active", ' +
  'sum(case when (midas_user.disabled = \'f\' and community_user.disabled =\'f\') and "is_manager" then 1 else 0 end) as "admins" ' +
  'from community_user ' +
  'join midas_user on midas_user.id = user_id ' +
  'where community_id = ?';

const taskCommunityStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'left join cycle on cycle.cycle_id = task.cycle_id ' +
  'where task.community_id= ? and ';

const internshipCommunityStateQuery = 'select @task.*, @owner.*, @applicants.* ' +
  'from @task task ' +
  'inner join @midas_user owner on task."userId" = owner.id ' +
  'left join cycle on cycle.cycle_id = task.cycle_id ' +
  'left join application_task on application_task.task_id = task.id ' +
  'left join application on application.application_id = application_task.application_id and application.submitted_at is not null ' +
  'left join @midas_user applicants on applicants.id = application.user_id ' +
  'where task.community_id = ? and ';

const communityTaskQuery = 'select count(*) from task where "community_id" = ? ';

const withTasksQuery = 'select count(distinct "userId") from task ';

const taskHistoryQuery = 'select "assignedAt", "completedAt", "createdAt", "publishedAt", "submittedAt" from task' ;

const postQuery = 'select count(*) from comment ';

const agencyPostQuery = 'select count(*) from comment ' +
'join task on comment."taskId" = task.id ' +
'where task.agency_id = ?';

const communityPostQuery = 'select count(*) from comment ' +
'join task on comment."taskId" = task.id ' +
'where task.community_id = ?';

const communityCyclicalPostQuery = 'select count(CASE when current_step = 0 and submitted_at is null  THEN 1 ELSE NULL end) as step0NextStepTotal, ' +
'count(CASE when current_step = 1 and submitted_at is null THEN 1 ELSE NULL end) as step1SelectInternshipTotal, ' +
 'count(CASE when current_step = 2 and submitted_at is null THEN 1 ELSE NULL end) as step2ExpRefTotal,' +
 'count(CASE when current_step = 3 and submitted_at is null THEN 1 ELSE NULL end) as step3EducationTotal, ' +
 'count(CASE when current_step = 4 and submitted_at is null THEN 1 ELSE NULL end) as step4LanguageTotal, ' +
  'count(CASE when current_step = 5 and submitted_at is null THEN 1 ELSE NULL end) as step5StatementTotal, ' +
  'count(CASE when current_step = 6 and submitted_at is null THEN 1 ELSE NULL end) as step6ReviewTotal, ' +
  'count(CASE when internship_completed_at is not null then 1 ELSE NULL end) as InternshipCompleteTotal, ' +
  'count(case when task_list.title = \'Primary\' then 1 else null end) as PrimaryCount, ' +
  'count(case when task_list.title = \'Alternate\' then 1 else null end) as AlternateCount,' +
  'count(CASE when submitted_at is not null then 1 ELSE NULL end) as submittedTotal ' +
   'from application app left join task_list_application tla on app.application_id = tla.application_id ' +
   'left join task_list on tla.task_list_id = task_list.task_list_id '+
   'where app.community_id = ? and app.cycle_id = ? ' ;


const volunteerCountQuery = 'select ' +
    'count(*) as signups, ' +
    'sum(case when assigned then 1 else 0 end) as assignments, ' +
    'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer';

const agencyVolunteerCountQuery = 'select ' +
  'count(*) as signups, ' +
  'sum(case when assigned then 1 else 0 end) as assignments, ' +
  'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer join task on task.id = volunteer."taskId" ' +
  'where task.agency_id = ?';

const communityVolunteerCountQuery = 'select ' +
  'count(*) as signups, ' +
  'sum(case when assigned then 1 else 0 end) as assignments, ' +
  'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer join task on task.id = volunteer."taskId" ' +
  'where task.community_id = ?';

const communityVolunteerCyclicalCountQuery = 'select ' +
  'count(*) as signups, ' +
  'sum(case when assigned then 1 else 0 end) as assignments, ' +
  'sum(case when "taskComplete" then 1 else 0 end) as completions ' +
  'from volunteer join task on task.id = volunteer."taskId" ' +
  'where task.community_id = ? and task.cycle_id = ? ';

const communityTaskCreatedPerUserQuery = 'select count(*) as created from task ' +
  'inner join community_user on community_user.user_id = task."userId" ' +
  'where task.community_id = ? and task."userId" = ? ';

const communityTaskVolunteerPerUserQuery = 'select count(*) as participated from volunteer ' +
  'inner join task on task.id = volunteer."taskId" ' +
  'where task.community_id = ? and volunteer."userId" = ? ';

const ownerListQuery = 'select midas_user.id, midas_user.name ' +
'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
'inner join agency on agency.agency_id = midas_user.agency_id ' +
'where midas_user.disabled = false and agency.agency_id = ? ';


const ownerCommunityListQuery ='select midas_user.id,midas_user.name ' +
'from midas_user inner join community_user on midas_user.id = community_user.user_Id ' +
'where community_user.community_id = ?';

const communityListQuery = 'select community.* from community ' + 
  'join community_user on community_user.community_id = community.community_id ' +
  'where community_user.is_manager = true and community_user.user_id = ?';

const userListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'where lower(username) like ? or lower(name) like ? ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userAgencyListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'where (lower(username) like ? or lower(midas_user.name) like ?) and agency_id = ? ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userCommunityListFilteredQuery = 'select midas_user.id, midas_user.name, midas_user.username, midas_user.government_uri, ' +
  'count(*) over() as full_count, agency.name as agency, community_user.created_at as joined_at, ' +
  'community_user.is_manager as "isCommunityAdmin", community_user.disabled ' +
  'from midas_user inner join community_user on midas_user.id = community_user.user_id ' +
  'left join agency on agency.agency_id = midas_user.agency_id ' +
  'where midas_user.disabled = \'f\' ' +
  'and (lower(username) like ? or lower(midas_user.name) like ? or lower(agency.name) like ?) ' +
  'and community_user.community_id = ? ' +
  'order by community_user.created_at desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userTaskState = 'select state from task where "userId" = ? ';

const participantTaskState = 'select task.state from task inner join volunteer on volunteer."taskId" = task.id where volunteer."userId" = ? ';

const taskStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'left join community on task.community_id = community.community_id ' +
  'where (community.target_audience <> 2 or community.target_audience is null) and ';

const taskAgencyStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'where task.agency_id = ? and community_id is null and ';

const activityQuery = 'select comment."createdAt", comment.id, \'comment\' as type ' +
  'from midas_user ' +
  'inner join comment on midas_user.id = comment."userId" ' +
  'inner join task on comment."taskId" = task.id ' +
  'where task.cycle_id is null ' +
  'union all ' +
  'select volunteer."createdAt", volunteer.id, \'volunteer\' as type ' +
  'from volunteer ' +
  'inner join midas_user on midas_user.id = volunteer."userId" ' +
  'inner join task on volunteer."taskId" = task.id ' +
  'where task.cycle_id is null ' +
  'union all ' +
  'select "createdAt", id, \'user\' as type ' +
  'from midas_user ' +
  'inner join community_user on midas_user.id = community_user.user_id ' +
  'inner join community on community_user.community_id = community.community_id ' +
  'where community.target_audience <> 2 ' +
  'union all ' +
  'select task."submittedAt" as "createdAt", task.id, \'task\' as type ' +
  'from task ' +
  'inner join midas_user on midas_user.id = task."userId" ' +
  'where task.cycle_id is null and task."submittedAt" is not null ' +
  'order by "createdAt" desc ' +
  'limit 20';

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

const activityTaskQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", task."submittedAt" as "createdAt" ' +
  'from midas_user ' +
  'inner join task on midas_user.id = task."userId" ' +
  'where task."submittedAt" is not null and task.id = ? ';

const agencyActivityQuery = 'select comment."createdAt", comment.id, \'comment\' as type ' +
  'from midas_user ' +
  'inner join comment on midas_user.id = comment."userId" ' +
  'inner join task on comment."taskId" = task.id ' +
  'where task.cycle_id is null ' +
  'and task.agency_id = $agencyId ' +
  'union all ' +
  'select volunteer."createdAt", volunteer.id, \'volunteer\' as type ' +
  'from volunteer ' +
  'inner join midas_user on midas_user.id = volunteer."userId" ' +
  'inner join task on volunteer."taskId" = task.id ' +
  'where task.cycle_id is null ' +
  'and task.agency_id = $agencyId ' +
  'union all ' +
  'select midas_user."createdAt" as "createdAt", id, \'user\' as type ' +
  'from midas_user ' +
  'inner join agency on midas_user.agency_id = agency.agency_id ' +
  'where agency.agency_id = $agencyId ' +
  'union all ' +
  'select task."createdAt", task.id, \'task\' as type ' +
  'from task ' +
  'inner join midas_user on midas_user.id = task."userId" ' +
  'where task.agency_id = $agencyId ' +
  'and task."submittedAt" is not null ' +
  'order by "createdAt" desc ' +
  'limit 20';

const agencyActivityTaskQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", task.agency_id, task."createdAt" ' +
  'from midas_user ' +
  'inner join task on midas_user.id = task."userId" ' +
  'where task.id = ? and task.agency_id = ? ';

const communityActivityQuery = 'select community_user.created_at as "createdAt", id, \'user\' as type ' +
  'from midas_user ' +
  'inner join community_user on midas_user.id = community_user.user_id ' +
  'where community_user.community_id = $communityId ' +
  'union all ' +
  'select task."createdAt", task.id, \'task\' as type ' +
  'from task ' +
  'inner join midas_user on midas_user.id = task."userId" ' +
  'where task.community_id = $communityId ' +
  'order by "createdAt" desc ' +
  'limit 10';

const communityActivityVolunteerQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", task.community_id, volunteer."createdAt" ' +
  'from volunteer ' +
  'left join midas_user on midas_user.id = volunteer."userId" ' +
  'left join task on volunteer."taskId" = task.id ' +
  'where volunteer.id = ? and task.community_id = ? ';

const communityActivityTaskQuery = 'select midas_user.name, midas_user.username, task.title, task.id "taskId", midas_user.id "userId", task.community_id, task."createdAt" ' +
  'from midas_user ' +
  'inner join task on midas_user.id = task."userId" ' +
  'where task.id = ? and task.community_id = ? ';

const communityTaskMetricsQuery = 'select @task.*, @tags.* ' +
  'from @task task ' + 
  'left join community on task.community_id = community.community_id '+
  'left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id ' +
  'left join @tagentity tags on tags.id = task_tags.tagentity_tasks ' +
   'where community.target_audience <> 2 and task.state <> \'archived\' and task.community_id= ? ';

const communityVolunteerTaskQuery='select volunteer.*, task.* ' +
   'from volunteer ' +
   'join task on task.id = volunteer."taskId" ' +
   'where task."completedAt" is not null and task.state <> \'archived\' and task.community_id = ?' ;

const taskMetricsQuery = 'select @task.*, @tags.* ' +
   'from @task task ' +
   'left join community on task.community_id = community.community_id '+
   'left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id ' +
   'left join @tagentity tags on tags.id = task_tags.tagentity_tasks ' +
   'where (community.target_audience <> 2 or community.target_audience is null) and task.state <> \'archived\' ';

const volunteerDetailsQuery = 'select @m_user.*, @tags.* ' +
  'from @midas_user m_user ' +
  'inner join volunteer on m_user.id = volunteer."userId" ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ' +
  "where tags.type = 'agency' ";


const volunteerAgencyTaskQuery='select volunteer.*, task.* ' +
  'from volunteer ' +
  'join task on task.id = volunteer."taskId" ' +
  'where task.agency_id= ? and task."completedAt" is not null and task.state <> \'archived\' ';

const agencyTaskMetricsQuery = 'select @task.*, @tags.* ' +
  'from @task task ' +
   'left join community on task.community_id = community.community_id '+
   'left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id ' +
   'left join @tagentity tags on tags.id = task_tags.tagentity_tasks ' +
   'where task.agency_id= ? and task.state <> \'archived\' and (community.target_audience <> 2 or community.target_audience is null) ';

const userAgencyQuery = 'select tagentity.name, midas_user."isAdmin" ' +
  'from midas_user inner join tagentity_users__user_tags on midas_user.id = tagentity_users__user_tags.user_tags ' +
  'inner join tagentity tagentity on tagentity.id = tagentity_users__user_tags.tagentity_users ' +
  'where midas_user.id = ? ' +
  "and tagentity.type = 'agency' ";

const userCommunityQuery = '';

const volunteerTaskQuery='select volunteer.*, task.* ' +
'from volunteer ' +
'join task on task.id = volunteer."taskId" ' +
'where task."completedAt" is not null and task.state <> \'archived\' ' ;
 
var exportFormat = {
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
  internship: {
    fetch: {
      owner: '',
      applicants: [],
    },
    exclude: {
      task: [ 'projectId', 'description', 'userId', 'updatedAt', 'deletedAt', 'publishedAt', 'assignedAt',
        'completedAt', 'completedBy', 'submittedAt', 'restrict' ],
      owner: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin' ],
      applicants: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
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
    Application: dao({ db: db, table: 'application' }),
    Agency: dao({ db: db, table: 'agency' }),
    Bureau: dao({db:db,table:'bureau'}),
    Office:dao({db:db,table:'office'}),
    User: dao({ db: db, table: 'midas_user' }),
    Task: dao({ db: db, table: 'task' }),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    TaskShare:dao({ db: db, table: 'task_share'}),
    AuditLog: dao({ db: db, table: 'audit_log' }),
    Community: dao({ db: db, table: 'community' }),
    CommunityUser: dao({ db: db, table: 'community_user' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    query: {
      taskQuery: taskQuery,
      taskStateQuery: taskStateQuery,
      agencyTaskMetricsQuery: agencyTaskMetricsQuery,
      agencyTaskStateQuery: agencyTaskStateQuery,
      communityTaskStateQuery: communityTaskStateQuery,
      communityTaskCreatedPerUserQuery: communityTaskCreatedPerUserQuery,
      communityTaskVolunteerPerUserQuery: communityTaskVolunteerPerUserQuery,     
      communityTaskMetricsQuery:communityTaskMetricsQuery,
      communityVolunteerTaskQuery:communityVolunteerTaskQuery,
      volunteerQuery: volunteerQuery,
      userQuery: userQuery,
      agencyUsersQuery: agencyUsersQuery,
      communityUsersQuery: communityUsersQuery,
      withTasksQuery: withTasksQuery,
      taskHistoryQuery: taskHistoryQuery,
      postQuery: postQuery,
      agencyPostQuery: agencyPostQuery,
      communityPostQuery: communityPostQuery,
      communityCyclicalPostQuery: communityCyclicalPostQuery,
      agencyVolunteerCountQuery: agencyVolunteerCountQuery,
      volunteerCountQuery: volunteerCountQuery,
      communityVolunteerCountQuery: communityVolunteerCountQuery,
      communityVolunteerCyclicalCountQuery: communityVolunteerCyclicalCountQuery,
      ownerListQuery: ownerListQuery,
      userListFilteredQuery: userListFilteredQuery,
      userAgencyListFilteredQuery: userAgencyListFilteredQuery,
      userCommunityListFilteredQuery: userCommunityListFilteredQuery,
      userTaskState: userTaskState,
      participantTaskState: participantTaskState,
      taskStateUserQuery: taskStateUserQuery,
      taskAgencyStateUserQuery: taskAgencyStateUserQuery,
      activityQuery: activityQuery,
      activityCommentQuery: activityCommentQuery,
      activityVolunteerQuery: activityVolunteerQuery,
      activityTaskQuery: activityTaskQuery,
      agencyActivityQuery: agencyActivityQuery,
      agencyActivityTaskQuery: agencyActivityTaskQuery,
      communityActivityQuery: communityActivityQuery,
      communityActivityVolunteerQuery: communityActivityVolunteerQuery,
      communityActivityTaskQuery: communityActivityTaskQuery,
      taskMetricsQuery: taskMetricsQuery,
      volunteerDetailsQuery: volunteerDetailsQuery,
      userAgencyQuery: userAgencyQuery,
      userCommunityQuery: userCommunityQuery,
      taskCommunityStateUserQuery: taskCommunityStateUserQuery,
      internshipCommunityStateQuery: internshipCommunityStateQuery,
      ownerCommunityListQuery: ownerCommunityListQuery,
      communityListQuery: communityListQuery,
      volunteerTaskQuery: volunteerTaskQuery,
      volunteerAgencyTaskQuery:volunteerAgencyTaskQuery,
    },
    clean: clean,
    options: options,
    exportFormat: exportFormat,
  };
};