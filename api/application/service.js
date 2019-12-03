const _ = require ('lodash');
const log = require('log')('app:application:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const Profile = require('../auth/profile');
const Import = require('./import');
const Audit = require('../model/Audit');

async function findOrCreateApplication (user, data) {
  var application = (await dao.Application.find('user_id = ? and community_id = ? and cycle_id = ?', [user.id, data.community.communityId, data.task.cycleId]))[0];
  if (!application) {
    application = await dao.Application.insert({
      userId: user.id,
      communityId: data.community.communityId,
      cycleId: data.task.cycleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return application;
}

function lookForErrors (recordResults) {
  return _.reduce(recordResults, (error, recordResult) => {
    return error || _.reduce(recordResult, (innerError, record) => {
      return innerError || record.err;
    }, false);
  }, false);
}

function filterOutErrors (recordList) {
  return _.filter(recordList, (record) => {
    return !record.err;
  });
}

function sortApplicationTasks (tasks) {
  if(_.uniq(_.map(tasks, task => { return task.sortOrder; })).length == tasks.length) {
    return tasks;
  } else {
    return _.map(_.sortBy(tasks, 'sortOrder'), async (task, index) => {
      task.sortOrder = index + 1;
      return await dao.ApplicationTask.update(task).catch(() => { return task; });
    });
  }
}

async function processUnpaidApplication (ctx,user, data, callback) {
  var application = await findOrCreateApplication(user, data);
  var applicationTasks = await dao.ApplicationTask.find('application_id = ? and sort_order <> -1', application.applicationId);
  if (_.find(applicationTasks, (applicationTask) => { return applicationTask.taskId == data.task.id; })) {
    callback(null, application.applicationId);
  } else if (applicationTasks.length >= 3) {
    callback({
      type:'maximum-reached',
      message: 'You\'ve already selected the maximum of three internships as part of your application to the U.S. Department of State Student Internship Program (Unpaid). If you want to apply to this internship, you must update your application to remove one of the selected internships.',
      applicationId: application.applicationId,
    });
  } else {
    var sortOrder = _.difference([1, 2, 3], applicationTasks.map((applicationTask) => { 
      return _.parseInt(applicationTask.sortOrder);
    }))[0];
    await dao.ApplicationTask.insert({
      applicationId: application.applicationId,
      userId: application.userId,
      taskId: data.task.id,
      sortOrder: sortOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).then(async () => {
      var audit = Audit.createAudit('APPLICATION_SUBMITTED', ctx, {
        applicationId: application.applicationId,
        userId: ctx.state.user.id,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
      });
      await dao.AuditLog.insert(audit).catch((err) => {
        log.error(err);
      });
    });
    callback(null, application.applicationId);
  }
}

async function updateEducation ( educationId, data ) {
  return await dao.Education.findOne('education_id = ? and user_id = ?',educationId,data.userId).then(async (e) => { 
    return await dao.Education.update(data).then((education) => {
      return education;
    }).catch((err) => {
      log.error(err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

module.exports = {};

module.exports.importProfileData = function (user, applicationId) {
  return new Promise(resolve => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, user.id).then(async () => {
      var profileSkillObject = (await db.query(dao.query.profileSkills, user.id)).rows;
      Profile.get(user.tokenset).then(profile => {
        Promise.all([
          Import.profileEducation(user.id, applicationId, profile.Profile.Educations),
          Import.profileExperience(user.id, applicationId, profile.Profile.WorkExperiences),
          Import.profileLanguages(user.id, applicationId, profile.Profile.Languages),
          Import.profileReferences(user.id, applicationId, profile.Profile.References),
          Import.profileSkills(user.id, applicationId, profileSkillObject),
        ]).then(resolve).catch((err) => {
          resolve();
          // record data import error
        });
      }).then(resolve).catch((err) => {
        resolve();
        // record error getting USAJOBS profile
      });
    }).catch((err) => {
      resolve();
      // record error locating application
    });
  });
};

module.exports.updateLanguage = async function (userId, data) {
  return await dao.ApplicationLanguageSkill.findOne('application_language_skill_id = ? and user_id =  ?', data.applicationLanguageSkillId, userId).then(async (l) => {
    return await dao.ApplicationLanguageSkill.update(_.extend(data, {
      updatedAt: l.updatedAt,
    })).then(async (language) => {
      return await dao.ApplicationLanguageSkill.query(dao.query.applicationLanguage, data.applicationId, { fetch: { 
        details: '',
        speakingProficiency: '', 
        readingProficiency: '', 
        writingProficiency: '' }});
    }).catch(err => {
      log.info('update: failed to update language', err);
      return false;
    });
  }).catch((err) => {
    return false;
  });
};

module.exports.deleteLanguage = async function (userId, applicationLanguageSkillId) {
  return await dao.ApplicationLanguageSkill.findOne('application_language_skill_id = ? and user_id =  ?', applicationLanguageSkillId, userId).then(async (l) => {
    return await dao.ApplicationLanguageSkill.delete('application_language_skill_id = ?', applicationLanguageSkillId).then(async (language) => {
      return language;
    }).catch(err => {
      log.info('delete: failed to delete language ', err);
      return false;
    });
  }).catch(err => {
    log.info('delete: record to delete not found ', err);
    return false;
  });
};

module.exports.saveLanguage = async function (userId, data) {
  return await dao.ApplicationLanguageSkill.findOne('application_id = ? and language_id = ?', [data.applicationId, data.languageId]).then(() => {
    return { err: 'language already exists' };
  }).catch(async () => { 
    return await dao.ApplicationLanguageSkill.insert(_.extend(data, {
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId,
    })).then(async (e) => {
      return await dao.ApplicationLanguageSkill.query(dao.query.applicationLanguage, data.applicationId, { fetch: { 
        details: '',
        speakingProficiency: '', 
        readingProficiency: '', 
        writingProficiency: '' }});
    }).catch(err => {
      log.error('save: failed to save language ',  err);
      return false;
    });
  });
};

module.exports.saveSkill = async function (userId, applicationId, attributes) {
  return await dao.ApplicationSkill.delete('application_id = ? ', [applicationId]).then(async () => { 
    var tags = [].concat(attributes || []);
    return await processUserTags({ userId: userId, username: attributes.username }, applicationId, tags).then(async () => {
      return await db.query(dao.query.applicationSkill, applicationId, { fetch: { name: ''}});
    }).catch(err => {
      log.error('save: failed to save skill ',  err);
      return false;
    });
  }).catch(err => {
    log.info('delete: failed to delete skill(s) ', err);
    return false;
  });
};

function processUserTags (user, applicationId, tags) {
  return Promise.all(tags.map(async (tag) => {
    if(_.isNaN(_.parseInt(tag.id))) {
      await createNewSkillTag(user, applicationId, tag);
    } else {
      _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
      tag = _.pickBy(tag, _.identity);
      if (tag.id) {
        return await createApplicationSkill(user, applicationId, tag);
      } else {
        await createNewSkillTag(user, applicationId, tag);
      }
    }
  }));
}

async function createNewSkillTag (user, applicationId, tag) {
  tag.name = tag.name.trim();
  return await dao.TagEntity.insert({
    name: tag.name, 
    type: tag.tagType,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).then(async (t) => {
    return await createApplicationSkill(user, applicationId, t);
  }).catch(err => {
    log.info('skill: failed to create skill tag ', user.username, tag, err);
  });
}

async function createApplicationSkill (user, applicationId, tag) {
  return await dao.ApplicationSkill.insert({ 
    applicationId: applicationId, 
    userId: user.userId, 
    skillId: tag.id,
    createdAt: new Date(),
  }).catch(err => {
    log.info('skill: failed to create tag ', user.username, application_id, err);
  });
}

module.exports.apply = async function (ctx,user, taskId, getTasks, callback) {
  await dao.Task.findOne('id = ?', taskId).then(async task => {
    await dao.Community.findOne('community_id = ?', task.communityId).then(async community => {
      if (community.applicationProcess == 'dos') {
        await new Promise((resolve, reject) => {
          processUnpaidApplication(ctx,user, { task: task, community: community }, (err, applicationId) => {
            if (err) {
              reject(err);
            } else {
              resolve(applicationId);
            }
          });
        }).then(async applicationId => {
          if (getTasks) {
            callback(null, (await db.query(dao.query.applicationTasks, applicationId)).rows);
          } else {
            callback(null, applicationId);
          }
        }).catch(callback);
      } else {
        // We don't know yet how to handle this type of application
        log.error('User attempted to apply to a community task that is not defined.', taskId);
        callback({ message: 'An error occurred attempting to start your application.' });
      }
    }).catch(err => {
      log.error('User attempted to apply to task but the community was not found.', err);
      callback({ message: 'An error occurred attempting to start your application.' });
    });
  }).catch(err => {
    log.error('User attempted to apply to task but none found.', err);
    callback({ message: 'An error occurred attempting to start your application.' });
  });
};

module.exports.deleteApplication = async (ctx, userId, applicationId, callback) => { 
  await dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async (application) => {
    var applicationNotificationData= await getNotificationApplicationData(userId, applicationId );     
    await dao.Application.delete(application).then(async () => {
      var audit = Audit.createAudit('APPLICATION_WITHDRAWN', ctx, {
        applicationId: application.applicationId,
        userId: ctx.state.user.id,
      });
      await dao.AuditLog.insert(audit).catch((err) => {
        log.error(err);
      });
      if(applicationNotificationData) {
        var notificationData = await getNotificationTemplateData(applicationNotificationData, 'state.department/internship.application.withdraw');
        if(!notificationData.model.user.bounced) {
          notification.createNotification(notificationData);
        }     
      }   
      callback();       
    }).catch((err) => {
      log.error('An error was encountered trying to withdraw an application', err);
      callback({ message: 'An error was encountered trying to withdraw this application.' });
    });
  }).catch((err) => {
    log.error('An error was encountered trying to widthraw an application', err);
    callback({ message: 'An error was encountered trying to withdraw this application.' });
  });
};

module.exports.deleteApplicationTask = async function (userId, applicationId, taskId) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then((application) => {
      db.transaction(function* (transaction) {
        yield transaction.query('DELETE from application_task WHERE task_id = $1 and application_id = $2', [taskId, applicationId]);
        var updatedAt = new Date();
        yield transaction.query('UPDATE application SET current_step = $1, updated_at = $2 WHERE application_id = $3', [1, updatedAt, applicationId]);
        return { 
          applicationId: applicationId,
          currentStep: 1,
          updatedAt: updatedAt,
        };
      }).then(async (result) => {
        resolve(result);
      }).catch((err) => {
        reject({ status: 400, message: 'An unexpected error occured attempting to remove this internship selection from your application.' });
      });
    }).catch((err) => {
      reject({ status: 403 });
    });
  });
};

module.exports.findById = async function (userId, applicationId) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async application => {
      var results = await Promise.all([
        db.query(dao.query.applicationTasks, applicationId, { fetch: { securityClearance: '' }}),
        dao.Education.query(dao.query.applicationEducation, applicationId, { fetch: { country: '', countrySubdivision: '', degreeLevel: '', honor: '' }}),
        dao.Experience.query(dao.query.applicationExperience, applicationId, { fetch: { country: '', countrySubdivision: '' }}),
        dao.ApplicationLanguageSkill.query(dao.query.applicationLanguage, applicationId, { fetch: { 
          details: '',
          speakingProficiency: '', 
          readingProficiency: '', 
          writingProficiency: '' }}),
        dao.Reference.query(dao.query.applicationReference, applicationId, { fetch: { referenceType: '' }}),
        db.query(dao.query.applicationSkill, applicationId, { fetch: { name: ''}}),
        dao.LookUpCode.query(dao.query.securityClearance, applicationId, { fetch: { securityClearance: ''}}),
        db.query(dao.query.submittedApplicationCommunity, applicationId, { fetch: { communityName: ''}}),
        db.query(dao.query.submittedApplicationCycle, applicationId, { fetch: { cycle: '' }}),
      ]);
      application.tasks = sortApplicationTasks(results[0].rows);
      application.education = results[1];
      application.experience = results[2];
      application.language = results[3];
      application.reference = results[4];
      application.skill = results[5].rows;
      application.securityClearance = results[6];
      application.communityName = results[7].rows[0];
      application.cycle = results[8].rows[0];
      resolve(application);
    }).catch((err) => {
      reject();
    });
  });
};

module.exports.getTranscripts = async function (user) {
  return new Promise((resolve, reject) => {
    Profile.getDocuments(user.tokenset, 'transcripts').then(documents => {
      resolve(documents);
    }).catch((err) => {
      // record error getting USAJOBS profile
      reject(err);
    });
  });
};

module.exports.swapApplicationTasks = async function (userId, applicationId, data) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async () => {
      db.transaction(function* (transaction) {
        yield transaction.query('UPDATE application_task SET sort_order = $1 WHERE application_task_id = $2', [data[1].sortOrder, data[0].applicationTaskId]);
        yield transaction.query('UPDATE application_task SET sort_order = $1 WHERE application_task_id = $2', [data[0].sortOrder, data[1].applicationTaskId]);
      }).then(async () => {
        resolve((await db.query(dao.query.applicationTasks, applicationId)).rows);
      }).catch((err) => {
        reject({ status: 400, message: 'An unexpected error occured attempting to update your internship selections from your application.' });
      });
    }).catch((err) => {
      reject({ status: 403 });
    });
  });
};
module.exports.swapExperiences = async function (userId, applicationId, data) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async () => {
      db.transaction(function* (transaction) {
        yield transaction.query('UPDATE experience SET sort_order = $1 WHERE experience_id = $2', [data[1].sortOrder, data[0].experienceId]);
        yield transaction.query('UPDATE experience SET sort_order = $1 WHERE experience_id = $2', [data[0].sortOrder, data[1].experienceId]);
      }).then(async () => { 
        resolve((await dao.Experience.query(dao.query.applicationExperience, applicationId, { fetch: { country: '', countrySubdivision: '' }})));
      }).catch((err) => {
        reject({ status: 400, message: 'An unexpected error occured attempting to update your experiences from your application.' });
      });
    }).catch((err) => {
      reject({ status: 403 });
    });
  });
};

module.exports.updateApplication = async function (ctx, userId, applicationId, data) {
  return await dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async () => {
    return await dao.Application.update(data).then(async (application) => {
      if (application.submittedAt) {
        sendApplicationNotification(userId, applicationId, 'state.department/internship.application.received');
        var audit = Audit.createAudit('APPLICATION_SUBMITTED', ctx, {
          applicationId: application.applicationId,
          userId: ctx.state.user.id,
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        });
        await dao.AuditLog.insert(audit).catch((err) => {
          log.error(err);
        });
      } else {
        var audit = Audit.createAudit('APPLICATION_UPDATED', ctx, {
          applicationId: application.applicationId,
          userId: ctx.state.user.id,
          updatedAt:application.updatedAt,
        });
        await dao.AuditLog.insert(audit).catch((err) => {
          log.error(err);
        });
      }
      return application;
    }).catch((err) => {
      return false;
    });
  }).catch((err) => {
    return false;
  });
};

module.exports.saveEducation = async function (attributes,done) { 
  attributes.updatedAt = new Date(); 
  attributes.createdAt= new Date();
  await dao.Education.insert(attributes).then(async (education) => {   
    return done(null, education);
  }).catch(err => {
    return done(true);
  });
};

module.exports.deleteEducation= async function (educationId){
  await dao.Education.delete('education_id = ?', educationId).then(async (education) => {
    return education;
  }).catch(err => {
    log.info('delete: failed to delete Education ', err);
    return false;
  });
};

module.exports.saveEducation = async function (attributes,done) { 
  if(attributes.educationId){ 
    await updateEducation(attributes.educationId,attributes).then((education) => {   
      return done(!education, education);
    });
  }
  else {
    attributes.createdAt= new Date();
    attributes.updatedAt = new Date();
    await dao.Education.insert(attributes).then(async (education) => {   
      return done(null, education);
    }).catch(err => {
      return done(true);
    });
  }
};

async function insertExperience (attributes) {
  return await dao.Application.findOne('application_id = ? and user_id = ?',attributes.applicationId,attributes.userId).then(async (e) => { 
    return await dao.Experience.insert(attributes).then(async (experience) => {  
      return experience;
    }).catch(err => {
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

async function updateExperience (attributes) {
  return await dao.Experience.findOne('experience_id = ? and user_id = ?',attributes.experienceId,attributes.userId).then(async (e) => { 
    return await dao.Experience.update(attributes).then((experience) => {
      return experience;
    }).catch((err) => {
      log.error(err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

module.exports.saveExperience = async function (attributes,done) { 
  attributes.countryId = attributes.country.id;
  if(attributes.countrySubdivision){
    attributes.countrySubdivisionId = attributes.countrySubdivision.id;
  }

  if (attributes.experienceId) {
    await updateExperience(attributes).then((experience) => {   
      return done(!experience, experience);
    });
  } else {
    attributes.updatedAt = new Date(); 
    attributes.createdAt = new Date();
    await insertExperience(attributes).then((experience) => {   
      return done(!experience, experience);
    });
  }
};

module.exports.deleteExperience= async function (experienceId){
  await dao.Experience.delete('experience_id = ?', experienceId).then(async (experience) => {
    return experience;
  }).catch(err => {
    log.info('delete: failed to delete Experience ', err);
    return false;
  });
};

module.exports.getEducation= async function (educationId){
  var country= (await dao.Country.db.query(dao.query.country,educationId)).rows[0];
  return await dao.Education.findOne('education_id = ?', educationId).then((education) => {  
    education.country=country;
    return education;
  }).catch((err) => {
    log.info('error', err);
    return null;
  });
};

async function insertReference (attributes) {
  return await dao.Application.findOne('application_id = ? and user_id = ?', attributes.applicationId,attributes.userId).then(async (e) => { 
    return await dao.Reference.insert(attributes).then(async (reference) => {   
      return reference;
    }).catch(err => {
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

async function updateReference (attributes) {
  return await dao.Reference.findOne('reference_id = ? and user_id = ?', attributes.referenceId,attributes.userId).then(async (e) => { 
    return await dao.Reference.update(attributes).then((reference) => {
      return reference;
    }).catch((err) => {
      log.error(err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

module.exports.saveReference = async function (attributes,done) { 
  if (attributes.referenceId) {
    await updateReference(attributes).then((reference) => {   
      return done(!reference, reference);
    });
  } else {
    attributes.updatedAt = new Date(); 
    attributes.createdAt = new Date();
    await insertReference(attributes).then((reference) => {   
      return done(!reference, reference);
    });
  }
};

module.exports.deleteReference= async function (referenceId, userId){
  return await dao.Reference.findOne('reference_id = ? and user_id = ?',referenceId,userId).then(async (e) => { 
    return await dao.Reference.delete('reference_id = ?', referenceId).then(async (reference) => {
      return reference;
    }).catch(err => {
      log.info('delete: failed to delete Reference ', err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
};

module.exports.internshipCompleted = async function (userId, data) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ?', data.applicationId).then(application => {
      data.updatedAt = application.updatedAt;
      data.internshipUpdatedBy = userId;
      if(data.complete.match(/^true$/)) {
        data.internshipCompleted = data.taskId;
        data.internshipCompletedAt = new Date();
      } else {
        data.internshipCompleted = null;
        data.internshipCompletedAt = null;
      }
      dao.Application.update(data).then(resolve).catch(reject);
    }).catch(reject);
  });
}

async function sendApplicationNotification (userId, applicationId, action) {
  Promise.all([
    dao.User.findOne('id = ?', userId),
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId),
    db.query(dao.query.applicationTasks, applicationId, { fetch: { securityClearance: '' }}),
  ]).then(async (results) => {
    results[1].tasks = _.sortBy(results[2].rows, 'sortOrder');
    var data = {
      user: results[0],
      application: results[1],
      cycle: await dao.Cycle.findOne('cycle_id = ?', results[1].cycleId),
    };
    var notificationData = await getNotificationTemplateData(data, action);
    if(!notificationData.model.user.bounced) {
      notification.createNotification(notificationData);
    }
  }).catch((err) => {
    log.error(err);
    // maybe some error handling
  }); 
}

function getNotificationApplicationData (userId, applicationId){
  return Promise.all([
    dao.User.findOne('id = ?', userId),
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId),
    db.query(dao.query.applicationTasks, applicationId, { fetch: { securityClearance: '' }}),
  ]).then(async (results) => {
    results[1].tasks = _.sortBy(results[2].rows, 'sortOrder');
    var data = {
      user: results[0],
      application: results[1],
      cycle: await dao.Cycle.findOne('cycle_id = ?', results[1].cycleId),
    };
    return data;
  }).catch((err) => {
    log.error(err);
    return err; 
  }); 
 
}

async function getNotificationTemplateData (data, action) {
  return {
    action: action,
    layout: 'state.department/layout.html',
    model: data,
  };
}