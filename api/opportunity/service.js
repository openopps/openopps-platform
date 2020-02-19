const _ = require ('lodash');
const fs = require('fs');
const log = require('log')('app:opportunity:service');
const db = require('../../db');
const elasticService = require('../../elastic/service');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const badgeService = require('../badge/service')(notification);
const communityService = require('../community/service');
const Badge =  require('../model/Badge');
const json2csv = require('json2csv');
const moment = require('moment');
const Task = require('../model/Task');
const Audit = require('../model/Audit');
const Agency = require('../model/Agency');

function findOne (id) {
  return dao.Task.findOne('id = ?', id);
}

async function findById (id, user) {
  var results = await dao.Task.query(dao.query.task + ' where task.id = ?', id, dao.options.task);
  if(results.length === 0) {
    return {};
  }
  var task = dao.clean.task(results[0]);
  task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);
  if(task.owner && task.owner.agencyId) {
    task.owner.agency = await Agency.fetchAgency(task.owner.agencyId);
  }
  if (task.agencyId) {
    task.agencies = Agency.toList(await Agency.fetchAgency(task.agencyId));
  }
  if(task.payLevelId){
    task.payLevel =await dao.PayPlan.findOne('pay_plan_id = ?', task.payLevelId).catch(() => { return null; });
  }
  if (user) {
    task.saved = await dao.SavedTask.findOne('deleted_at is null and task_id = ? and user_id = ?', id, user.id).then(() => {
      return true;
    }).catch(() => {
      return false;
    });
  }
  if(user && user.hiringPath=='student'){
    task.application=(await dao.Application.db.query(dao.query.applicationTasks,user.id,task.id)).rows[0];
  }
  if(task.communityId){
    task.community=(await dao.Community.db.query(dao.query.communityTaskQuery,task.communityId)).rows[0];
    if (user) {
      task.communityUser= (await dao.CommunityUser.db.query(dao.query.communityUserQuery,user.id,task.communityId)).rows[0];
    }
  }
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
    task.cycle = await dao.Cycle.findOne('cycle_id = ?', task.cycleId).catch(() => { return null; });
    if (task.cycle) {
      task.cycle.phase = await dao.Phase.findOne('phase_id = ?', task.cycle.phaseId).catch(() => { return null; });
    }
  }
  task.volunteers = user ? (await dao.Task.db.query(dao.query.volunteer, task.id)).rows : undefined;
  return task;
}

async function list (user) {
  var tasks = [];
  if(user && user.isAdmin) {
    tasks = dao.clean.tasks(await dao.Task.query(dao.query.task + ' order by task."createdAt" desc', {}, dao.options.task));
  } else {
    var where = " where task.restrict::text = '{}' or task.restrict->>'projectNetwork' = 'false'";
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
  tag.name = tag.name.trim();
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
    if (attributes.communityId != null)
    {
      task.community = await communityService.findById(attributes.communityId);
      var share = {
        task_id: task.id,
        user_id: attributes.userId,
        shared_by_user_id: attributes.userId,
        last_modified: new Date,
      };
      await dao.TaskShare.insert(share);
    }
    
    await elasticService.indexOpportunity(task.id);
   
    return done(null, task);
  }).catch(err => {
    return done(true);
  });
}

async function sendTaskNotification (user, task, action) {
  var data = await getNotificationTemplateData(user, task, action);
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function getSavedOpportunities (user) {
  return (await db.query(dao.query.savedTask, user.id)).rows;
}

async function canUpdateOpportunity (user, id) {
  var task = await dao.Task.findOne('id = ?', id).catch(() => { return null; });
  if (!task) {
    return false;
  } else if (task.userId == user.id || user.isAdmin
    || (user.isAgencyAdmin && await checkAgency(user, task.userId))
    || await isCommunityAdmin(user, task)) {
    return true;
  } else {
    return false;
  }
}

async function canAdministerTask (user, id) {
  var task = await dao.Task.findOne('id = ?', id).catch(() => { return null; });
  if (!task) {
    return false;
  } else if ((user.isAgencyAdmin && user.agencyId == task.agencyId)
    || await isCommunityAdmin(user, task) || await isCommunityApprover(user, task)) {
    return true;
  } else {
    return false;
  }
}

async function getCommunities (userId) {
  var communities = await dao.Community.query(dao.query.communitiesQuery, userId);
  var communityTypes = {
    federal: _.filter(communities, { targetAudience: 1 }),
    student: _.filter(communities, { targetAudience: 2 }),
  };
  return communityTypes;
}

async function getUsdosSupportEmail () {
  var supportEmail = (await dao.Community.query(dao.query.usdosSupportEmailQuery));
  return supportEmail;
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
    return user.agency.agencyId == owner.agency.agencyId;
  }
  return false;
}

async function isCommunityAdmin (user, task) {
  if (task && task.communityId) {
    return (await dao.CommunityUser.findOne('user_id = ? and community_id = ?', user.id, task.communityId).catch(() => {
      return {};
    })).isManager;
  } else {
    return false;
  }
}

async function isCommunityApprover (user, task) {
  if (task && task.communityId) {
    var community = await dao.Community.findOne('community_id = ?', task.communityId).catch(() => {
      return undefined;
    });
    // If community is DoS then must check same bureau
    if(!community || (community.referenceId == 'dos' && !_.find(user.bureauOffice, { bureau_id: task.bureauId }) )) {
      return false;
    } else {
      return (await dao.CommunityUser.findOne('user_id = ? and community_id = ?', user.id, task.communityId).catch(() => {
        return {};
      })).isApprover;
    }
  } else {
    return false;
  }
}

async function updateOpportunityState (attributes, done) {
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  attributes.updatedAt = new Date();
  attributes.assignedAt = attributes.state === 'in progress' && !origTask.assignedAt ? new Date : origTask.assignedAt;
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

async function updateOpportunity (ctx, attributes, done) {
  var errors = await Task.validateOpportunity(attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(null, null, errors);
  }
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  var tags = attributes.tags || attributes['tags[]'] || [];
  attributes.communityId = attributes.communityId == '' ? null : attributes.communityId;
  if ((origTask.communityId != attributes.communityId) && attributes.state !=='draft') {  
    attributes.state = 'submitted';
    attributes.submittedAt = null;
    attributes.publishedAt = null;
    attributes.assignedAt = null;
    attributes.completedAt = null;
    attributes.canceledAt = null;
  }
  attributes.assignedAt = attributes.state === 'assigned' && origTask.state !== 'assigned' ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && origTask.state !== 'open' ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && origTask.state !== 'completed' ? new Date : origTask.completedAt;
  attributes.submittedAt = attributes.state === 'submitted' && origTask.state !== 'submitted' ? new Date : origTask.submittedAt;
  attributes.canceledAt = attributes.state === 'canceled' && origTask.state !== 'canceled' ? new Date : origTask.canceledAt;
  
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async (task) => {
    var audit = Audit.createAudit('TASK_UPDATED', ctx, {
      taskId: task.id,
      previous: _.omitBy(origTask, (value, key) => { return _.isEqual(attributes[key], value); }),
      changes: _.omitBy(attributes, (value, key) => { return _.isEqual(origTask[key], value); }),
    });
    await dao.AuditLog.insert(audit).catch((err) => {
      log.error(err);
    });

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
      else if(attributes.language && attributes.language.length==0){
        await dao.LanguageSkill.delete('task_id = ?',task.id);    
      }
      
      var getApplicantsForUpdates = fs.readFileSync(__dirname + '/sql/getInternshipApplicantsForUpdates.sql', 'utf8');  
      var applicants = (await db.query(getApplicantsForUpdates, attributes.id)).rows;

      if ((task.cityName !== origTask.cityName || task.countrySubdivisionId !== origTask.countrySubdivisionId || task.countryId !== origTask.countryId || task.bureauId !== origTask.bureauId || task.officeId !== origTask.officeId) && new Date(task.cycle.applyEndDate) > new Date() && applicants.length > 0) {
        _.forEach(applicants, (applicant) => {
          sendApplicantsUpdatedNotification(applicant, 'internship.applicants.update');
        });
      }
    }
    await dao.TaskTags.db.query(dao.query.deleteTaskTags, task.id)
      .then(async () => {
        await processTaskTags(task, tags).then(async tags => {
          task.tags = tags;
          await elasticService.indexOpportunity(task.id);
          return done(task, origTask.state !== task.state || origTask.communityId !== task.communityId);
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

async function completedInternship (attributes, done) {
  attributes.updatedAt = new Date();
  attributes.completedAt = new Date();
  attributes.state = 'completed';
  await dao.Task.update(attributes).then(async (t) => {
    var task = await findById(t.id, true);
    var owner= await dao.User.findOne('id = ?', task.owner.id);
    sendHiringManagerSurveyNotification(owner);
    var completedInterns= (await dao.TaskListApplication.db.query(dao.query.completedInternsQuery,task.id)).rows;
    _.forEach(completedInterns, (intern) => {
      sendInternSurveydNotification(intern, 'internship.completed.survey');
    });
    await elasticService.indexOpportunity(task.id);
    return done(true);
  }).catch (err => {
    return done(false);
  });
}
async function canceledInternship (ctx,attributes, done) {
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  attributes.canceledAt = attributes.state === 'canceled' && origTask.state !== 'canceled' ? new Date : origTask.canceledAt;

  var getApplicants = fs.readFileSync(__dirname + '/sql/getInternshipApplicants.sql', 'utf8');  
  var applicants= (await db.query(getApplicants, attributes.id)).rows;

  await dao.Task.update(attributes).then(async (t) => {
    var task = await findById(t.id, true);
    var cycle=  await dao.Cycle.findOne('cycle_id = ?', task.cycleId).catch(() => { return null; });
    if(new Date(cycle.applyEndDate) > new Date() && applicants.length>0){
      _.forEach(applicants, (applicant) => {
        sendApplicantsCanceledNotification(applicant, 'internship.applicants.canceled');
      });  
    }
    var audit = Audit.createAudit('INTERNSHIP_CANCELED', ctx, {
      taskId: t.id,
      title:origTask.title,
      user: _.pick(await dao.User.findOne('id = ?', ctx.state.user.id), 'id', 'name', 'username'),
      taskCreator:_.pick(await dao.User.findOne('id = ?', origTask.userId), 'id', 'name', 'username'),
    });
    await dao.AuditLog.insert(audit).catch((err) => {
      log.error(err);
    });
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

async function canUpdateInternship (user, id) {
  var task = await dao.Task.findOne('id = ?', id).catch(() => { return null; });
  if (!task) {
    return false;
  } else if (user.isAdmin
  || await isCommunityAdmin(user, task)) {
    return true;
  } else {
    return false;
  }
}
async function checkCommunityAdmin (user, id) {
  var task = await dao.Task.findOne('id = ?', id);
  if (task && task.communityId) {
    return (await dao.CommunityUser.findOne('user_id = ? and community_id = ?', user.id, task.communityId).catch(() => {
      return {};
    })).isManager;
  } else {
    return false;
  }
}
async function getInternNotificationTemplateData (intern, action) {
  var data = {
    action: action,
    layout: 'state.department/layout.html',
    model: {     
      user: intern,
    },
  };
  return data;

}
async function getNotificationTemplateData (user, task, action) {
  var data = {
    action: action,
    layout: 'layout.html',
    model: {
      task: task,
      user: user,
    },
  };
  if (task.communityId) {
    data.model.community = await dao.Community.findOne('community_id = ?', task.communityId).catch(() => { return null; });
    data.model.cycle = await dao.Cycle.findOne('cycle_id = ?', task.cycleId).catch(() => { return null; });
    var templateOverride = await dao.CommunityEmailTemplate.findOne('community_id = ? and action = ?', task.communityId, action).catch(() => { return null; });
    if (templateOverride) {
      data.action = templateOverride.template,
      data.layout = templateOverride.layout || data.layout;
    }
  }
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

  var updateBaseData = (admin) => {
    var data = _.cloneDeep(baseData);
    data.model.admin = admin;
    if(!data.model.admin.bounced) {
      notification.createNotification(data);
    }
  };
  if (task.communityId && task.bureau_id) {
    var bureauAdmins = await dao.User.query(dao.query.communityBureauAdminsQuery, task.communityId, task.bureau_id);
    _.forEach(bureauAdmins.length ? bureauAdmins : (await dao.User.query(dao.query.communityBureauAdminsQuery, task.communityId, task.bureau_id)), updateBaseData);
  } else if (task.communityId) {
    _.forEach((await dao.User.query(dao.query.communityAdminsQuery, task.communityId)), updateBaseData);
  } else {
    _.forEach(await dao.User.find('"is_approver" = true and disabled = false'), updateBaseData);
  }
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

async function sendHiringManagerSurveyNotification (user) {
  var data = await getInternNotificationTemplateData(user, 'state.department/internship.hiringmanager.survey');
  if(!data.model.bounced) {
    notification.createNotification(data);
  }
}

async function sendInternSurveydNotification (user) {
  var data = await getInternNotificationTemplateData(user, 'state.department/internship.completed.survey');
  if(!data.model.bounced) {
    notification.createNotification(data);
  }
}
async function sendApplicantsCanceledNotification (user) {
  var data = await getInternNotificationTemplateData(user, 'state.department/internship.applicants.canceled');
  if(!data.model.bounced) {
    notification.createNotification(data);
  }
}


async function sendApplicantsUpdatedNotification (user) {
  var data = await getInternNotificationTemplateData(user, 'state.department/internship.applicants.update');
  if(!data.model.bounced) {
    notification.createNotification(data);
  }
}

function newInternship (title, attributes, cycleId, user) {
  return {
    createdAt: new Date(),
    updatedAt: new Date(),
    title: title,
    userId: user.id,
    restrict: getRestrictValues(user),
    state: 'draft',
    description: attributes.description,
    details: attributes.details,
    outcome: attributes.outcome,
    about: attributes.about,
    agencyId: attributes.agencyId,
    communityId: attributes.communityId,
    officeId: attributes.officeId,
    bureauId: attributes.bureauId,
    cityName: attributes.cityName,
    cycleId: cycleId,
    countryId: attributes.countryId,
    countrySubdivisionId: attributes.countrySubdivisionId,
    interns: attributes.interns,
    suggestedSecurityClearance: attributes.suggestedSecurityClearance,
  };
}

async function copyOpportunity (attributes, user, done) {
  var results = await dao.Task.findOne('id = ?', attributes.taskId);
  var language= await dao.LanguageSkill.find('task_id = ?',attributes.taskId);
  var tags = await dao.TaskTags.find('task_tags = ?', attributes.taskId);
  if(results === null) {
    return {};
  }
  var task = {
    createdAt: new Date(),
    updatedAt: new Date(),
    title: attributes.title,
    userId: user.id,
    restrict: getRestrictValues(user),
    state: 'draft',
    description: results.description,
    details: results.details,
    outcome: results.outcome,
    about: results.about,
    agencyId: user.agencyId,
    communityId: results.communityId,
  };
  if(await isStudent(results.userId,results.id)) {
    var cycleId = await getCurrentCycle(results.communityId, results.cycleId);
    if (!cycleId) {
      return done({'message':'There are no current cycle dates set. Please contact your administrator to request the cycle times be added.'});
    } else {
      var intern = newInternship(attributes.title, results, cycleId, user);
      await dao.Task.insert(intern).then(async (intern) => {
        if(language && language.length >0){
          language.forEach(async (value) => {
            var newValue= _.omit(value,'languageSkillId');
            newValue.updatedAt= new Date();
            newValue.createdAt= new Date();      
            newValue.taskId = intern.id;
            await dao.LanguageSkill.insert(newValue).then(async () => {
              done(null, true);     
            }).catch (err => {
              done(err);
            });  
          });
        }
        tags.map(tag => {
          dao.TaskTags.insert({ tagentity_tasks: tag.tagentityTasks, task_tags: intern.id }).catch(err => {
            log.info('register: failed to update tag ', attributes.username, tag, err);
          });
        });
        if (results.communityId != null)
        {
          var share = {
            task_id: intern.id,
            user_id: user.id,
            shared_by_user_id: user.id,
            last_modified: new Date,
          };
          await dao.TaskShare.insert(share);
        }
        await elasticService.indexOpportunity(intern.id);
        return done(null, { 'taskId': intern.id });
      }).catch (err => { return done({'message':'Error copying task.'}); });
    }
  } else {
    await dao.Task.insert(task)
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
}

function getRestrictValues (user) {
  return restrict = {
    name: user.agency.name,
    abbr: user.agency.abbr,
    parentAbbr: '',
    slug: user.agency.slug,
    domain: user.agency.domain,
    projectNetwork: false,
  };
}

async function getCurrentCycle (communityId, cycleId) {
  var cycles = await dao.Cycle.find('community_id = ? and posting_start_date <= now() and posting_end_date >= now()', communityId);
  if (_.find(cycles, (cycle) => { return cycle.cycleId == cycleId; })) {
    return cycleId;
  } else {
    return (_.sortBy(cycles, 'cycleId' )[0] || {}).cycleId;
  }
}

async function deleteTask (ctx, task, cycleId) {
  if(cycleId){
    var cycle= await dao.Cycle.findOne('cycle_id=?',cycleId).catch(err=>{
      return null;
    });
    if((cycle) && (cycle.applyStartDate > new Date())) {
      return await removeTask(ctx, task);
    }
    else {
      return false;
    }
  }
  else{
    return await removeTask(ctx, task);
  }
}

async function removeTask (ctx, task) {
  await dao.TaskTags.delete('task_tags = ?', task.id).then(async () => {
    dao.Volunteer.delete('"taskId" = ?', task.id).then(async () => {
      dao.Task.delete('id = ?', task.id).then(async () => {
        var audit = Audit.createAudit('TASK_DELETED', ctx, {
          taskId: task.id,
          title: task.title,
          creator: task.userId,
        });
        await dao.AuditLog.insert(audit).catch((err) => {
          log.error(err);
        });
        await elasticService.deleteOpportunity(task.id);
        return true;
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

async function saveOpportunity (user, data, callback) {
  var savedTask = await dao.SavedTask.findOne('task_id = ? and user_id = ?', data.taskId, user.id).catch(() => { return null; });
  if(data.action == 'unsave' && !savedTask || (data.action == 'save' && savedTask && !savedTask.deletedAt)) {
    callback();
  } else if (data.action == 'unsave' || (data.action == 'save' && savedTask && savedTask.deletedAt)) {
    savedTask.deletedAt = (data.action == 'unsave' ? new Date() : null);
    await dao.SavedTask.update(savedTask);
    callback();
  } else {
    await dao.SavedTask.insert({ user_id: user.id, task_id: data.taskId, created_at: new Date() });
    callback();
  }
}

async function getVanityURL (vanityURL) {
  var community = (await db.query(dao.query.lookUpVanityURLQuery, vanityURL)).rows[0];
  return community;
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
  completedInternship: completedInternship,
  copyOpportunity: copyOpportunity,
  canceledInternship:canceledInternship, 
  canUpdateInternship:canUpdateInternship,
  checkCommunityAdmin:checkCommunityAdmin,
  deleteTask: deleteTask,
  volunteersCompleted: volunteersCompleted,
  sendTaskNotification: sendTaskNotification,
  sendTaskStateUpdateNotification: sendTaskStateUpdateNotification,
  sendTaskAssignedNotification: sendTaskAssignedNotification,
  sendTaskAppliedNotification: sendTaskAppliedNotification,
  sendTasksDueNotifications: sendTasksDueNotifications,
  sendHiringManagerSurveyNotification: sendHiringManagerSurveyNotification,
  sendInternSurveydNotification: sendInternSurveydNotification,
  sendApplicantsCanceledNotification: sendApplicantsCanceledNotification,
  sendApplicantsUpdatedNotification: sendApplicantsUpdatedNotification,
  canUpdateOpportunity: canUpdateOpportunity,
  canAdministerTask: canAdministerTask,
  getCommunities: getCommunities,
  getUsdosSupportEmail: getUsdosSupportEmail,
  getSavedOpportunities: getSavedOpportunities,
  saveOpportunity: saveOpportunity,
  getVanityURL: getVanityURL,
};


module.exports.getApplicantsForTask = async (user, taskId) => {
  return new Promise((resolve, reject) => {
    dao.Task.findOne('id = ?', taskId).then(async task => {
      if(await communityService.isCommunityManager(user, task.communityId)) {
        db.query(fs.readFileSync(__dirname + '/sql/getInternshipApplicants.sql', 'utf8'), task.id).then(results => {
          resolve(results.rows);
        }).catch(err => {
          reject({ status: 401 });
        });
      } else {
        reject({ status: 404 });
      }
    }).catch(err => {
      reject({ status: 404 });
    });
  });
};

module.exports.getSelectionsForTask = async (user, taskId) => {
  return new Promise((resolve, reject) => {
    db.query(fs.readFileSync(__dirname + '/sql/getInternshipSelections.sql', 'utf8'), taskId).then(results => {
      resolve(results.rows);
    }).catch(err => {
      reject({ status: 401 });
    });
  });
};


module.exports.getCommunityList = async () => {
  return await dao.Community.find();
};
