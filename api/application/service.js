const _ = require ('lodash');
const log = require('log')('app:application:service');
const db = require('../../db');
const dao = require('./dao')(db);
const Profile = require('../auth/profile');
const Import = require('./import');

async function findOrCreateApplication (data) {
  var application = (await dao.Application.find('user_id = ? and community_id = ? and cycle_id = ?', [data.userId, data.community.communityId, data.task.cycleId]))[0];
  if (!application) {
    application = await dao.Application.insert({
      userId: data.userId,
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

async function processUnpaidApplication (data, callback) {
  var application = await findOrCreateApplication(data);
  var applicationTasks = await dao.ApplicationTask.find('application_id = ?', application.applicationId);
  if (_.find(applicationTasks, (applicationTask) => { return applicationTask.taskId == data.task.id; })) {
    callback(null, application.applicationId);
  } else if (applicationTasks.length >= 3) {
    callback({
      type:'maximum-reached',
      message: 'You have already picked the maximum of 3 programs. To apply to this internship please remove at least 1 of your already chosen programs from your application.',
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
      updateAt: new Date(),
    });
    callback(null, application.applicationId);
  }
}

async function updateEducation ( educationId,data) {
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

module.exports.deleteLanguage = async function (applicationLanguageSkillId){
  await dao.ApplicationLanguageSkill.delete('application_language_skill_id = ?', applicationLanguageSkillId).then(async (language) => {
    return language;
  }).catch(err => {
    log.info('delete: failed to delete Language ', err);
    return false;
  });
};

module.exports.saveLanguage = async function (userId, applicationId, data) {
  var record = data.language[0];
  return await dao.ApplicationLanguageSkill.findOne('application_id = ? and language_id = ?', [applicationId, record.languageId]).then(() => {
    return { err: 'language already exists' };
  }).catch(async () => { 
    return await dao.ApplicationLanguageSkill.insert(_.extend(record, {
      createdAt: new Date(),
      updatedAt: new Date(),
      applicationId: applicationId,
      userId: userId,
    })).then(applicationLanguageSkill => {
      return applicationLanguageSkill;
    }).catch(err => {
      return false;
    });
  });
};

module.exports.apply = async function (userId, taskId, callback) {
  await dao.Task.findOne('id = ?', taskId).then(async task => {
    await dao.Community.findOne('community_id = ?', task.communityId).then(async community => {
      // need a way to determine DoS Unpaid vs VSFS
      if (community.applicationProcess == 'dos') {
        await processUnpaidApplication({ userId: userId, task: task, community: community }, callback);
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

module.exports.deleteApplicationTask = async function (userId, applicationId, taskId) {
  return new Promise((resolve, reject) => {
    dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(() => {
      dao.ApplicationTask.delete('task_id = ? and application_id = ?', taskId, applicationId).then(() => {
        resolve();
      }).catch((err) => {
        reject({ status: 400, message: 'An unexpected error occured attempting to remove this internship selection from your application.' });
      });
    }).catch((err) => {
      reject({ status: 403 });
    });
  });
};

module.exports.findById = async function (applicationId) {
  var application = (await dao.Application.query(dao.query.application, applicationId))[0];
  if(application) {
    var results = await Promise.all([
      db.query(dao.query.applicationTasks, applicationId),
      dao.Education.query(dao.query.applicationEducation, applicationId, { fetch: { country: '', countrySubdivision: '' ,degreeLevel:'',honor:''}}),
      dao.Experience.query(dao.query.applicationExperience, applicationId, { fetch: { country: '', countrySubdivision: '' }}),
      dao.ApplicationLanguageSkill.query(dao.query.applicationLanguage, applicationId, { fetch: { 
        details: '',
        speakingProficiency: '', 
        readingProficiency: '', 
        writingProficiency: '' }}),
      dao.Reference.query(dao.query.applicationReference, applicationId, { fetch: { referenceType: '' }}),
    ]);
    application.tasks = results[0].rows;
    application.education = results[1];
    application.experience = results[2];
    application.language = results[3];
    application.reference = results[4];
  }
  return application;
};

module.exports.importProfileData = async function (user, applicationId) {
  return await dao.Application.findOne('application_id = ? and user_id = ?', applicationId, user.id).then(async () => {
    return await Profile.get({ access_token: user.access_token, id_token: user.id_token }).then(async profile => {
      return await Promise.all([
        Import.profileEducation(user.id, applicationId, profile.Profile.Educations),
        Import.profileExperience(user.id, applicationId, profile.Profile.WorkExperiences),
        Import.profileLanguages(user.id, applicationId, profile.Profile.Languages),
        Import.profileReferences(user.id, applicationId, profile.Profile.References),
      ]).then((results) => {
        return {
          error: lookForErrors(results),
          education: filterOutErrors(results[0]),
          experience: filterOutErrors(results[1]),
          language: filterOutErrors(results[2]),
          reference: filterOutErrors(results[3]),
        };
      }).catch((err) => {
        return { err: err };
      });
    }).catch((err) => {
      return { err: 'Unable to get data from your USAJOBS profile.' };
    });
  }).catch((err) => {
    return false;
  });
};

module.exports.updateApplication = async function (userId, applicationId, data) {
  return await dao.Application.findOne('application_id = ? and user_id = ?', applicationId, userId).then(async () => {
    return await dao.Application.update(data).then((application) => {
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
  attributes.countrySubdivisionId = attributes.countrySubdivision.id;

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
  return await dao.Application.findOne('application_id = ? and user_id = ?',attributes.applicationId,attributes.userId).then(async (e) => { 
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
  return await dao.Reference.findOne('reference_id = ? and user_id = ?',attributes.referenceId,attributes.userId).then(async (e) => { 
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