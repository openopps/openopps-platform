const _ = require('lodash');
const dao = require('postgres-gen-dao');
const moment = require('moment');

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

const communityUserQuery='select * from community_user '+
'inner join community on community_user.community_id = community.community_id ' + 
'where community_user.user_id = ?';

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

const tasksToIndex = `select row_to_json(row)
from (
  select t.id, t.title, t.description, t.state, t.details, t.outcome, t.about, t.restrict ->> 'abbr' as "restrictedToAgency", u.name,
  (
    select tags.data ->> 'abbr' as "postingAgency"
    from tagentity_users__user_tags utags
    inner join tagentity tags on utags.tagentity_users = tags.id
    where tags.type = 'agency' and utags.user_tags = u.id
    order by "updatedAt" desc
    limit 1
  ),
  (
    select array_to_json(array_agg(row_to_json(s)))
    from (
                    select skilltags.id, skilltags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity skilltags on skilltags.id = tt.tagentity_tasks
                    where skilltags.type = 'task-people' and tt."task_tags" = t.id
    ) s
  ) as "task-people",
  (
    select array_to_json(array_agg(row_to_json(s)))
    from (
                    select taskpeopletags.id, taskpeopletags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity taskpeopletags on taskpeopletags.id = tt.tagentity_tasks
                    where taskpeopletags.type = 'skill' and tt."task_tags" = t.id
    ) s 
  ) as skills,
  (
    select array_to_json(array_agg(row_to_json(s)))
    from (
                    select tasklengthtags.id, tasklengthtags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity tasklengthtags on tasklengthtags.id = tt.tagentity_tasks
                    where tasklengthtags.type = 'task-length' and tt."task_tags" = t.id
    ) s 
  ) as "task-length",
  (
    select array_to_json(array_agg(row_to_json(l)))
    from (
                    select languagetags.id, languagetags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity languagetags on languagetags.id = tt.tagentity_tasks
                    where languagetags.type = 'location' and tt."task_tags" = t.id
    ) l
  ) as "location",
  (
    select array_to_json(array_agg(row_to_json(l)))
    from (
                    select locationtags.id, locationtags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity locationtags on locationtags.id = tt.tagentity_tasks
                    where locationtags.type = 'task-time-estimate' and tt."task_tags" = t.id
    ) l
  ) as "task-time-estimate",
  (
    select array_to_json(array_agg(row_to_json(l)))
    from (
                    select ltags.id, ltags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity ltags on ltags.id = tt.tagentity_tasks
                    where ltags.type = 'series' and tt."task_tags" = t.id
    ) l
  ) as series,
  (
    select array_to_json(array_agg(row_to_json(l)))
    from (
                    select timetags.id, timetags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity timetags on timetags.id = tt.tagentity_tasks
                    where timetags.type = 'task-time-required' and tt."task_tags" = t.id
    ) l
  ) as "task-time-required",
  (
    select array_to_json(array_agg(row_to_json(l)))
    from (
                    select careertags.id, careertags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity careertags on careertags.id = tt.tagentity_tasks
                    where careertags.type = 'career' and tt."task_tags" = t.id
    ) l
  ) as "career",
  (
    select array_to_json(array_agg(row_to_json(s)))
    from (
                    select skilltags.id, skilltags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity skilltags on skilltags.id = tt.tagentity_tasks
                    where skilltags.type = 'task-skills-required' and tt."task_tags" = t.id
    ) s
  ) as "task-skills-required",
  (
    select array_to_json(array_agg(row_to_json(k)))
    from (
                    select keytags.id, keytags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity keytags on keytags.id = tt.tagentity_tasks
                    where keytags.type = 'keywords' and tt."task_tags" = t.id
    ) k
  ) as keywords,
  (
    select array_to_json(array_agg(row_to_json(k)))
    from (
                    select topictags.id, topictags.name
                    from tagentity_tasks__task_tags tt
                    left join tagentity topictags on topictags.id = tt.tagentity_tasks
                    where topictags.type = 'topic' and tt."task_tags" = t.id
    ) k
  ) as topic
  from task t
  inner join midas_user u on t."userId" = u.id         
  order by t.id
) row`;

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
      tasksToIndex: tasksToIndex,
      communityUserQuery:communityUserQuery,
    },
    options: options,
    clean: clean,
    exportFormat: exportFormat,
  };
};
