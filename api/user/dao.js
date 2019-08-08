const _ = require('lodash');
const dao = require('postgres-gen-dao');
const badgeDescriptions = require('../../utils').badgeDescriptions;

const tagQuery = 'select tags.* ' +
  'from tagentity tags ' +
  'inner join tagentity_users__user_tags user_tags on tags.id = user_tags.tagentity_users ' +
  'where user_tags.user_tags = ?';

const userAgencyQuery = 'select tagentity.name, midas_user."isAdmin" ' +
  'from midas_user inner join tagentity_users__user_tags on midas_user.id = tagentity_users__user_tags.user_tags ' +
  'inner join tagentity tagentity on tagentity.id = tagentity_users__user_tags.tagentity_users ' +
  'where midas_user.id = ? ' +
  "and tagentity.type = 'agency' ";

const taskParticipatedQuery = 'select task.*, volunteer.assigned, volunteer."taskComplete" ' +
  'from task inner join volunteer on task.id = volunteer."taskId" ' +
  'where volunteer."userId" = ?';

const deleteUserTags = 'delete from tagentity_users__user_tags where id in (' +
  'select tagentity_users__user_tags.id ' +
  'from tagentity_users__user_tags ' +
  'join tagentity on tagentity.id = tagentity_users and type not in (\'skill\', \'topic\') ' +
  'where user_tags = ?)';

const deleteSkillTags = 'delete from tagentity_users__user_tags where id in (' +
  'select tagentity_users__user_tags.id ' +
  'from tagentity_users__user_tags ' +
  'join tagentity on tagentity.id = tagentity_users and type in (\'skill\', \'topic\') ' +
  'where user_tags = ?)';

const applicationStatusQuery = 'SELECT app.application_id AS "id", app.submitted_at AS "submittedAt", ' +
  'comm.community_name AS "communityName", c.name AS "cycleName", c.cycle_start_date AS "cycleStartDate", ' +
  'c.apply_end_date AS "applyEndDate", app.updated_at AS "updatedAt", phase."name", phase."sequence", ' +
  'case when app.internship_completed_at is not null then true else false end as "internshipComplete", ' +
  '( ' +
		'select ' +
			'task.state ' +
		'from application ' +
		'inner join task_list_application tla on application.application_id = tla.application_id ' +
    'inner join task_list on tla.task_list_id = task_list.task_list_id ' +
    'inner join task on task_list.task_id = task.id ' +
    'where application.application_id = app.application_id ' +
    'limit 1 ' +
	') as "taskState", ' +
	'( ' +
		'select ' +
			'task_list.title ' +
		'from application ' +
		'inner join task_list_application tla on application.application_id = tla.application_id ' +
		'inner join task_list on tla.task_list_id = task_list.task_list_id ' +
    'where application.application_id = app.application_id ' +
    'limit 1 ' +
	') as "reviewProgress" ' +
  'FROM application app ' +
  'INNER JOIN community comm ON app.community_id = comm.community_id ' +
  'INNER JOIN cycle c ON app.cycle_id = c.cycle_id ' +
  'LEFT JOIN phase ON c.phase_id = phase.phase_id ' +
  'WHERE app.user_id = ? ';

const savedTaskQuery = 'select ' +
  'task.id, task.title, task.state, task.community_id as "communityId", task."updatedAt", ' +
  'task.city_name as "cityName", csub.value as "countrySubdivision", country.value as country, cycle.apply_end_date as "applyEndDate" ' +
  'from task ' +
  'join saved_task on saved_task.task_id = task.id ' +
  'left join cycle on cycle.cycle_id = task.cycle_id ' +
  'left join country_subdivision csub on csub.country_subdivision_id = task.country_subdivision_id ' +
  'left join country on country.country_id = task.country_id ' +
  'where saved_task.deleted_at is null and saved_task.user_id = ? and cycle.apply_end_date > now()::date';

const options = {
  user: {
    fetch: {
      tags: [],
      agency: '',
    },
    exclude: {
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ],
    },
  },
};

const clean = {
  users: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function (tag) {
        return _.pickBy(tag, _.identity);
      });
      return cleaned;
    });
  },
  profile: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    cleaned.badges = (cleaned.badges || []).map(function (badge) {
      return _.pickBy(badge, _.identity);
    });
    cleaned.tags = (cleaned.tags || []).map(function (tag) {
      return _.pickBy(tag, _.identity);
    });
    return cleaned;
  },
  activity: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
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
    Agency: dao({ db: db, table: 'agency' }),
    Application: dao({ db: db, table: 'application'}),
    AuditLog: dao({ db: db, table: 'audit_log'}),
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    SavedTask: dao({ db: db, table: 'saved_task' }),
    Passport: dao({ db: db, table: 'passport' }),
    Cycle: dao({ db: db, table: 'cycle' }),
    Country: dao({ db: db, table: 'country' }),
    CountrySubdivision: dao({ db: db, table: 'country_subdivision' }),
    query: {
      tag: tagQuery,
      participated: taskParticipatedQuery,
      userAgencyQuery: userAgencyQuery,
      deleteUserTags: deleteUserTags,
      deleteSkillTags: deleteSkillTags,
      applicationStatus: applicationStatusQuery,
      savedTask: savedTaskQuery,
    },
    options: options,
    clean: clean,
  };
};
