const _ = require ('lodash');
const log = require('log')('app:opportunity:service');
const db = require('../../db');
const elasticService = require('../../elastic/service');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const badgeService = require('../badge/service')(notification);
const Badge =  require('../model/Badge');
const json2csv = require('json2csv');
const moment = require('moment');
const Task = require('../model/Task');

const baseTask = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

function findOne (id) {
  return dao.Task.findOne('id = ?', id);
}

async function findById (id, loggedIn) {
  var results = await dao.Task.query(dao.query.task + ' where task.id = ?', id, dao.options.task);
  if(results.length === 0) {
    return {};
  }
  var task = dao.clean.task(results[0]);
  task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);

  if(await isStudent(task.userId,task.id)){
    var country=(await dao.Country.db.query(dao.query.intern,task.userId,task.id)).rows[0];
  
    if(country !=null){
      task.country= country;
     
    }  
    var countrySubData=(await dao.CountrySubdivision.db.query(dao.query.countrySubdivision,task.userId,task.id)).rows[0];    
    if(countrySubData !=null){     
      task.countrySubdivision=countrySubData;
    } 
    task.language= (await dao.LookupCode.db.query(dao.query.languageList,task.id)).rows;
  }
  task.volunteers = loggedIn ? (await dao.Task.db.query(dao.query.volunteer, task.id)).rows : undefined;
  return task;
}

async function list (user) {
  var tasks = [];
  if(user && user.isAdmin) {
    tasks = dao.clean.tasks(await dao.Task.query(dao.query.task + ' order by task."createdAt" desc', {}, dao.options.task));
  } else {
    var where = " where task.restrict->>'projectNetwork' = 'false'";
    if(user && user.agency && !_.isEmpty(user.agency.data)) {
      where += " or task.restrict->>'abbr' = '" + user.agency.data.abbr + "'";
      where += " or task.restrict->>'parentAbbr' = '" + user.agency.data.abbr + "'";
      if(user.agency.data.parentAbbr) {
        where += " or task.restrict->>'parentAbbr' = '" + user.agency.data.parentAbbr + "'";
        where += " or task.restrict->>'abbr' = '" + user.agency.data.parentAbbr + "'";
      }
    }
    tasks = dao.clean.tasks(await dao.Task.query(dao.query.task + where + ' order by task."createdAt" desc', {}, dao.options.task));
  }
  tasks = await Promise.all(tasks.map(async (task) => {
    task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);
    return task;
  })); 
  return tasks;
}

async function commentsByTaskId (id) {
  var comments = await dao.Comment.query(dao.query.comments, id, dao.options.comment);
  return { comments: dao.clean.comments(comments) };
}

function processTaskTags (task, tags) {
  return Promise.all(tags.map(async (tag) => {
    if(_.isNumber(tag)) {
      return await createTaskTag(tag, task);
    } else {
      _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
      if (tag.type == 'location' && !tag.id) {
        tag.id = ((await dao.TagEntity.find('type = ? and name = ?', 'location', tag.name))[0] || {}).id;
      }
      tag = _.pickBy(tag, _.identity);
      if (tag.id) {
        return await createTaskTag(tag.id, task);
      }
      return await createNewTaskTag(tag, task);
    }
  }));
}

async function createNewTaskTag (tag, task) {
  return await dao.TagEntity.insert(tag).then(async (t) => {
    return await createTaskTag(t.id, task);
  }).catch(err => {
    log.info('task: failed to create tag ', task.title, tag, err);
  });
}

async function createTaskTag (tagId, task) {
  return await dao.TaskTags.insert({ tagentity_tasks: tagId, task_tags: task.id }).then(async (tag) => {
    return await dao.TagEntity.findOne('id = ?', tag.tagentity_tasks).catch(err => {
      log.info('update task: failed to load tag entity ', task.id, tagId, err);
    });
  }).catch(err => {
    log.info('task: failed to create tag ', task.title, tagId, err);
  });
}

async function createOpportunity (attributes, done) { 
  var errors = await Task.validateOpportunity(attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors, null);
  }
  attributes.submittedAt = attributes.state === 'submitted' ? new Date : null;
  attributes.createdAt = new Date();
  attributes.updatedAt = new Date();
 
  await dao.Task.insert(attributes).then(async (task) => {
    var tags = attributes.tags || attributes['tags[]'] || [];
    await processTaskTags(task, tags).then(tags => {
      task.tags = tags;
    });
    
    if(attributes.language && attributes.language.length >0){
      attributes.language.forEach(async (value) => {
        value.updatedAt= new Date();
        value.createdAt= new Date();      
        value.taskId= task.id;
        await dao.LanguageSkill.insert(value).then(async () => {
          done(null, true);     
        }).catch (err => {
          done(err);
        });  
      });
    }

    task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);
    await elasticService.indexOpportunity(task.id);
   
    return done(null, task);
  }).catch(err => {
    return done(true);
  });
}


async function sendTaskNotification (user, task, action) {
  var data = {
    action: action,
    model: {
      task: task,
      user: user,
    },
  };
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function canUpdateOpportunity (user, id) {
  var task = await dao.Task.findOne('id = ?', id);
  if (task.userId == user.id || user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId))) {
    return true;
  }
  return false;
}

async function canAdministerTask (user, id) {
  var task = await dao.Task.findOne('id = ?', id);
  if (task && (user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId)))) {
    return true;
  }
  return false;
}
async function getCommunities (userId) {
  var communities = await dao.Community.query(dao.query.communitiesQuery, userId);
  var communityTypes = {
    federal: _.filter(communities, { targetAudience: 1 }),
    student: _.filter(communities, { targetAudience: 2 }),
  };
  return communityTypes;
}
async function isStudent (userId,taskId) {
  var taskCommunities = await dao.Community.query(dao.query.taskCommunitiesQuery, userId,taskId);
  var communityTypes = {
    federal: _.filter(taskCommunities, { targetAudience: 1 }),
    student: _.filter(taskCommunities, { targetAudience: 2 }),
  };
  if(communityTypes.student.length>0){
    return true;
  }
  else{
    return false;
  }
  
}


async function checkAgency (user, ownerId) {
  var owner = await dao.clean.user((await dao.User.query(dao.query.user, ownerId, dao.options.user))[0]);
  if (owner && owner.agency) {
    return user.tags ? _.find(user.tags, { 'type': 'agency' }).name == owner.agency.name : false;
  }
  return false;
}

async function updateOpportunityState (attributes, done) {
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  attributes.updatedAt = new Date();
  attributes.assignedAt = attributes.state === 'assigned' && !origTask.assignedAt ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && !origTask.publishedAt ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && !origTask.completedAt ? new Date : origTask.completedAt;
  attributes.canceledAt = attributes.state === 'canceled' && origTask.state !== 'canceled' ? new Date : origTask.canceledAt;
  await dao.Task.update(attributes).then(async (t) => {
    var task = await findById(t.id, true);
    task.previousState = origTask.state;
    await elasticService.indexOpportunity(task.id);
    return done(task, origTask.state !== task.state);
  }).catch (err => {
    return done(null, false, {'message':'Error updating task.'});
  });
}

async function updateOpportunity (attributes, done) {
  var errors = await Task.validateOpportunity(attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(null, null, errors);
  }
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  var tags = attributes.tags || attributes['tags[]'] || [];
  attributes.assignedAt = attributes.state === 'assigned' && origTask.state !== 'assigned' ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && origTask.state !== 'open' ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && origTask.state !== 'completed' ? new Date : origTask.completedAt;
  attributes.submittedAt = attributes.state === 'submitted' && origTask.state !== 'submitted' ? new Date : origTask.submittedAt;
  attributes.canceledAt = attributes.state === 'canceled' && origTask.state !== 'canceled' ? new Date : origTask.canceledAt;
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async (task) => {
    
    task.userId = task.userId || origTask.userId; // userId is null if editted by owner
    task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);
    task.volunteers = (await dao.Task.db.query(dao.query.volunteer, task.id)).rows;
    task.tags = [];
   
    if(await isStudent(task.userId,task.id)){
      if(attributes.language && attributes.language.length >0){
        await dao.LanguageSkill.delete('task_id = ?',task.id).then(async () => {
          attributes.language.forEach(async (value) => {
            value.updatedAt= new Date();
            value.createdAt= new Date();        
            value.taskId= task.id;
            await dao.LanguageSkill.insert(value).then(async () => {
              done(null, true);     
            }).catch (err => {
              done(err);
            });  
          });
        }).catch (err => {
          log.info('delete: failed to delete languageskill ', err);
          done(err);
        });
      }
      //if languages array is empty and have language skill data in table removing data from table based on task-id
      else if(attrubutes.language && attributes.language.length==0){
        await dao.LanguageSkill.delete('task_id = ?',task.id);    
      }
      // eslint-disable-next-line no-empty
      else{

      }

    }
    await dao.TaskTags.db.query(dao.query.deleteTaskTags, task.id)
      .then(async () => {
        await processTaskTags(task, tags).then(async tags => {
          task.tags = tags;
          await elasticService.indexOpportunity(task.id);
          return done(task, origTask.state !== task.state);
        });
      }).catch (err => { return done(null, false, {'message':'Error updating task.'}); });
  }).catch (err => {
    return done(null, false, {'message':'Error updating task.'});
  });
}

async function publishTask (attributes, done) {
  attributes.publishedAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async (t) => {
    var task = await findById(t.id, true);
    sendTaskNotification(task.owner, task, 'task.update.opened');
    await elasticService.indexOpportunity(task.id);
    return done(true);
  }).catch (err => {
    return done(false);
  });
}

function volunteersCompleted (task) {
  dao.Volunteer.find('"taskId" = ? and assigned = true and "taskComplete" = true', task.id).then(volunteers => {
    var userIds = volunteers.map(v => { return v.userId; });
    dao.User.db.query(dao.query.userTasks, [userIds]).then(users => {
      users.rows.map(user => {
        var badge = Badge.awardForTaskCompletion(task, user);
        if(badge) {
          badgeService.save(badge).catch(err => {
            log.info('Error saving badge', badge, err);
          });
        }
      });
    }).catch(err => {
      log.info('volunteers completed: error loading user tasks completed count', task.id, err);
    });
  }).catch(err => {
    log.info('volunteers completed: error loading volunteers', task.id, err);
  });
}

function sendTaskStateUpdateNotification (user, task) {
  switch (task.state) {
    case 'in progress':
      _.forEach(task.volunteers, (volunteer) => {
        sendTaskAssignedNotification(volunteer, task);
      });
      break;
    case 'completed':
      sendTaskCompletedNotification(user, task);
      _.forEach(_.filter(task.volunteers, { assigned: true, taskComplete: true }), (volunteer) => {
        sendTaskCompletedNotificationParticipant(volunteer, task);
      });
      break;
    case 'open':
      sendTaskNotification(user, task, 'task.update.opened');
      break;
    case 'submitted':
      sendTaskNotification(user, task, 'task.update.submitted');
      sendTaskSubmittedNotification(user, task, 'task.update.submitted.admin');
      break;
    case 'draft':
      sendTaskNotification(user, task, 'task.create.draft');
      break;
    case 'canceled':
      if (task.previousState == 'open') {
        _.forEach(task.volunteers, (volunteer) => {
          sendTaskNotification(volunteer, task, 'task.update.canceled');
        });
      } else if (task.previousState == 'in progress') {
        _.forEach(_.filter(task.volunteers, { assigned: true }), (volunteer) => {
          sendTaskNotification(volunteer, task, 'task.update.canceled');
        });
      }
      break;
  }
}

async function getNotificationTemplateData (user, task, action) {
  var data = {
    action: action,
    model: {
      task: task,
      user: user,
    },
  };
  return data;
}

async function sendTaskAssignedNotification (user, task) {
  var template = (user.assigned ? 'task.update.assigned' : 'task.update.not.assigned');
  var data = await getNotificationTemplateData(user, task, template);
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function sendTaskAppliedNotification (user, task) {
  var template = ('task.update.applied');
  var data = await getNotificationTemplateData(user, task, template);
  if(!data.model.task.owner.bounced) {
    notification.createNotification(data);
  }
}

async function sendTaskSubmittedNotification (user, task) {
  var baseData = await getNotificationTemplateData(user, task, 'task.update.submitted.admin');
  _.forEach(await dao.User.find('"isAdmin" = true and disabled = false'), (admin) => {
    var data = _.cloneDeep(baseData);
    data.model.admin = admin;
    if(!data.model.admin.bounced) {
      notification.createNotification(data);
    }
  });
}

async function sendTaskCompletedNotification (user, task) {
  var data = await getNotificationTemplateData(user, task, 'task.update.completed');
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function sendTaskCompletedNotificationParticipant (user, task) {
  var data = await getNotificationTemplateData(user, task, 'task.update.completed.participant');
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function copyOpportunity (attributes, user, done) {
  var results = await dao.Task.findOne('id = ?', attributes.taskId);
  var tags = await dao.TaskTags.find('task_tags = ?', attributes.taskId);
  if(results === null) {
    return {};
  }
  var task = {
    title: attributes.title,
    userId: user.id,
    restrict: getRestrictValues(user),
    state: 'draft',
    description: results.description,
    details: results.details,
    outcome: results.outcome,
    about: results.about,
  };

  var newTask = _.extend(_.clone(baseTask), task);
  await dao.Task.insert(newTask)
    .then(async (task) => {
      tags.map(tag => {
        dao.TaskTags.insert({ tagentity_tasks: tag.tagentityTasks, task_tags: task.id }).catch(err => {
          log.info('register: failed to update tag ', attributes.username, tag, err);
        });
      });
      await elasticService.indexOpportunity(task.id);
      return done(null, { 'taskId': task.id });
    }).catch (err => { return done({'message':'Error copying task.'}); });
}

function getRestrictValues (user) {
  var record = _.find(user.tags, { 'type': 'agency' });
  var restrict = {
    name: record.name,
    abbr: record.data.abbr,
    parentAbbr: record.data.parentAbbr,
    slug: record.data.slug,
    domain: record.data.domain,
    projectNetwork: false,
  };
  return restrict;
}

async function deleteTask (id) {
  await dao.TaskTags.delete('task_tags = ?', id).then(async (task) => {
    dao.Volunteer.delete('"taskId" = ?', id).then(async (task) => {
      dao.Task.delete('id = ?', id).then(async (task) => {
        await elasticService.indexOpportunity(id);
        return id;
      }).catch(err => {
        log.info('delete: failed to delete task ', err);
        return false;
      });
    }).catch(err => {
      log.info('delete: failed to delete volunteer from task ', err);
      return false;
    });
  }).catch(err => {
    log.info('delete: failed to delete task tags ', err);
    return false;
  });
}

async function getExportData () {
  var records = (await dao.Task.db.query(dao.query.taskExportQuery, 'agency')).rows;
  var fieldNames = _.keys(dao.exportFormat);
  var fields = _.values(dao.exportFormat);

  fields.forEach(function (field, fIndex, fields) {
    if (typeof(field) === 'object') {
      records.forEach(function (rec, rIndex, records) {
        records[rIndex][field.field] = field.filter.call(this, rec[field.field]);
      });
      fields[fIndex] = field.field;
    }
  });

  return json2csv({
    data: records,
    fields: fields,
    fieldNames: fieldNames,
  });
}

async function sendTasksDueNotifications (action, i) {
  var now = new Date(new Date().toISOString().split('T')[0]);
  var dateToCheck = i == 0 ? moment(new Date()).format('MM/DD/YYYY') : moment(new Date()).add(i, 'days').format('MM/DD/YYYY');

  await dao.Task.query(dao.query.tasksDueQuery, dateToCheck, 'assigned')
    .then(async (tasks) => {
      for (var i=0; i<tasks.length; i++) {
        var taskDetail = (await dao.Task.db.query(dao.query.tasksDueDetailQuery, tasks[i].id)).rows[0];
        var data = {
          action: action,
          model: {
            task: {
              id: tasks[i].id,
              title: tasks[i].title,
            },
            owner: {
              name: taskDetail.name,
              username: taskDetail.username,
            },
            volunteers: _.map((await dao.Task.db.query(dao.query.volunteerListQuery, tasks[i].id)).rows, 'username').join(', '),
          },
        };
        if (data.model.volunteers.length > 0) {
          notification.createNotification(data);
        }
      }
    });
}

module.exports = {
  findOne: findOne,
  findById: findById,
  list: list,
  commentsByTaskId: commentsByTaskId,
  createOpportunity: createOpportunity,
  updateOpportunityState: updateOpportunityState,
  updateOpportunity: updateOpportunity,
  publishTask: publishTask,
  copyOpportunity: copyOpportunity,
  deleteTask: deleteTask,
  getExportData: getExportData,
  volunteersCompleted: volunteersCompleted,
  sendTaskNotification: sendTaskNotification,
  sendTaskStateUpdateNotification: sendTaskStateUpdateNotification,
  sendTaskAssignedNotification: sendTaskAssignedNotification,
  sendTaskAppliedNotification: sendTaskAppliedNotification,
  sendTasksDueNotifications: sendTasksDueNotifications,
  canUpdateOpportunity: canUpdateOpportunity,
  canAdministerTask: canAdministerTask,
  getCommunities: getCommunities,
  
};
