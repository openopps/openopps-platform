const _ = require ('lodash');
const log = require('log')('app:activity:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function listBadges () {
  var tasks = await dao.Task.query(dao.query.taskHistoryQuery, 'completed', dao.options.taskHistory);
  for (var i = 0; i < tasks.length; i++) {
    tasks[i].badges = dao.clean.badge(await dao.Badge.query(dao.query.badgeQuery, tasks[i].id, dao.options.badge));
    tasks[i].participants = await dao.User.query(dao.query.participantsQuery, tasks[i].id, dao.options.participants);
  }
  var cleaned = await dao.clean.taskHistory(tasks);
  return cleaned;
}

async function usersList (user) {
  var agency = _.find(user.tags, (tag) => {
    return tag.type == 'agency';
  }) || {};
  return {
    title: (await dao.User.query(dao.query.userByTitle, user.id, user.title, dao.options.user)).splice(0,2),
    agency: await dao.User.query(dao.query.userByAgency, user.id, user.agencyId,dao.options.user ),
  };
}

async function getTaskCount (state) {
  var result = await dao.Task.db.query(dao.query.task, state);
  return result.rows[0].count;
}

async function getTaskTypeList (user) {
  return {
    careers: _.reject((await dao.Task.db.query(dao.query.taskByType, 'career', 4)).rows, { name: 'Acquisition' }).slice(0, 3),
    acquisition: _.filter((await dao.Task.db.query(dao.query.taskByType, 'career', 1)).rows, { name: 'Acquisition' }),
    skills: (await dao.Task.db.query(dao.query.taskByType, 'skill', 4)).rows,
    locations: (await dao.Task.db.query(dao.query.taskByType, 'location', 3)).rows,
    byProfile: generateByProfileQuery(user),
    communities : (await dao.Community.db.query(dao.query.communitiesTasks)).rows,
  };
}

function generateByProfileQuery (user) {
  var career = _.filter(user.tags, { type: 'career' })[0];
  var location = _.filter(user.tags, { type: 'location' })[0];
  var skills = _.filter(user.tags, { type: 'skill' }).slice(0, 5);
  var query = '?';
  if(!_.isEmpty(career)) {
    query += 'career=' + career.id + '&';
  }
  if(!_.isEmpty(location)) {
    query += 'location=' + location.name + '&';
  }
  if(!_.isEmpty(skills)) {
    query += 'skill=' + skills.map((skill) => { return skill.name; }).join(';');
  }
  return query;
}

module.exports = {
  listBadges: listBadges,
  usersList: usersList,
  getTaskCount: getTaskCount,
  getTaskTypeList: getTaskTypeList,
  getCommunities : this.getCommunities,
};