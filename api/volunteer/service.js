const _ = require ('lodash');
const crypto = require('crypto-wrapper');
const log = require('log')('app:volunteer:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const Profile = require('../auth/profile');

async function addVolunteer (tokenset, attributes, done) {
  var volunteer = await dao.Volunteer.find('"taskId" = ? and "userId" = ?', attributes.taskId, attributes.userId);
  if (volunteer.length == 0) {
    attributes.createdAt = new Date();
    attributes.updatedAt = new Date();
    if (attributes.resumeId) {
      var grantKey = await Profile.grantDocumentAccess(tokenset, attributes.resumeId, attributes.taskId);
      var encryptedKey = crypto.encrypt(grantKey.Key);
      attributes.grantAccess = encryptedKey.data;
      attributes.iv = encryptedKey.iv;
      attributes.nonce = grantKey.Nonce;
    }
    await dao.Volunteer.insert(attributes).then(async (volunteer) => {
      return done(null, volunteer);
    }).catch(err => {
      log.info('create: failed to add volunteeer ', err);
      return done({'message':'error adding volunteer'}, null);
    });
  } else {
    volunteer[0].silent = 'true';
    return done(null, volunteer[0]);
  }
}

async function assignVolunteer (volunteerId, assign, done) {
  var volunteer = (await dao.Volunteer.db.query(dao.query.assignedVolunteer, volunteerId)).rows[0];
  volunteer.assigned = assign;
  await dao.Volunteer.update({
    id: volunteerId,
    assigned: assign,
    assignedVolunteer: volunteer,
    updatedAt: new Date(),
  }).then(async (volunteer) => {
    return done(null, volunteer);
  }).catch(err => {
    log.info('Update: failed to set volunteer assigned ' + assign, err);
    return done({'message':'Unable to complete request'}, null);
  });
}

async function selectVolunteer (volunteerId,taskId, select, done) {
  var volunteer = (await dao.Volunteer.db.query(dao.query.assignedVolunteer, volunteerId)).rows[0];
  volunteer.selected = select;
  await dao.Volunteer.update({
    id: volunteerId,
    taskId:taskId,
    selected: select,
    assignedVolunteer: volunteer,
    updatedAt: new Date(),
  }).then(async (volunteer) => {
    return done(null, volunteer);
  }).catch(err => {
    log.info('Update: failed to set volunteer selected ' + select, err);
    return done({'message':'Unable to complete request'}, null);
  });
}

async function volunteerComplete (volunteerId, complete, done) {
  await dao.Volunteer.update({
    id: volunteerId,
    taskComplete: complete,
    updatedAt: new Date(),
  }).then(async (volunteer) => {
    return done(null, volunteer);
  }).catch(err => {
    log.info('Update: failed to set volunteer task complete ' + complete, err);
    return done({'message':'Unable to complete request'}, null);
  });
}

async function deleteVolunteer (attributes, done) {
  try {
    var volunteer = (await dao.Volunteer.db.query(dao.query.lookupVolunteer, attributes.userId, attributes.taskId)).rows[0];
    if(!volunteer) {
      return done(null, {'message':'error deleting volunteer'});
    } else {
      var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, volunteer.id)).rows;
      await dao.Volunteer.delete('id = ? and "taskId" = ?', volunteer.id, attributes.taskId).catch(err => {
        log.info('delete: failed to delete volunteeer ', err);
        return done(null, {'message':'error deleting volunteer'});
      });
      return done(notificationInfo, null);
    }
  } catch (err) {
    log.info('Error deleting volunteer', err);
    return done(null, {'message':'error deleting volunteer'});
  }
}

async function canAddVolunteer (attributes, user) {
  if (typeof attributes.userId !== 'undefined' && !user.isAdmin) {
    return false;
  }
  return true;
}

async function canManageVolunteers (id, user) {
  var task = await dao.Task.findOne('id = ?', id).catch(() => { return null; });
  return task && (task.userId === user.id || user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId)));
}

async function checkAgency (user, ownerId) {
  var owner = await dao.User.findOne(dao.query.user, ownerId, dao.options.user).catch(() => { return undefined; });
  if (owner && owner.agency) {
    return user.agency ? (user.agency.name == owner.agency.name) : false;
  }
  return false;
}

async function sendAddedVolunteerNotification (user, volunteer, action) {
  var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, volunteer.id)).rows;
  var data = {
    action: action,
    model: {
      task: { id: notificationInfo[0].id, title: notificationInfo[0].title },
      owner: { username: notificationInfo[0].ownerusername },
      user: user,
    },
  };
  data.model.community = await dao.Community.findOne('community_id = (select community_id from task where id = ?)', notificationInfo[0].id).catch(() => { return null; });
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
}

async function getResumes (user) {
  return new Promise((resolve, reject) => {
    Profile.getDocuments(user.tokenset, 'secure_resume').then(documents => {
      resolve(documents);
    }).catch((err) => {
      reject(err);
    });
  });
}

async function getVolunteerResumeAccess (tokenset, id) {
  return new Promise((resolve, reject) => {
    dao.Volunteer.findOne('id = ?', id).then(volunteer => {
      var document = {
        documentId: volunteer.resumeId,
        grantAccess: {
          Key: crypto.decrypt(volunteer.grantAccess, volunteer.iv),
          Nonce: volunteer.nonce,
        },
      };
      Profile.getDocumentAccess(tokenset, document, volunteer.taskId).then(documentAccess => {
        resolve(documentAccess);
      }).catch((err) => {
        reject(err);
      });
    }).catch(err => {
      reject(err);
    });
  });
}

async function getVolunteer (volunteerId,taskId) {
  return (await dao.Volunteer.find('id = ? and "taskId" = ?',volunteerId,taskId).catch(() => { return []; }));
}

async function updateVolunteer (tokenset, attributes, done) {  
  return await dao.Volunteer.findOne('id = ?', attributes.id).then(async (vol) => {  
    if (attributes.resumeId != vol.resumeId) {
      if (vol.grantAccess && vol.iv) {
        var document = {
          documentId: vol.resumeId,
          grantAccess: {
            Key: crypto.decrypt(vol.grantAccess, vol.iv),
            Nonce: vol.nonce,
          },
        };
        await Profile.revokeDocumentAccess(tokenset, document, vol.taskId).catch((err) => {
          log.error(err);
          return done({ message: 'An unexpected error occured trying to update your application.'});
        });
      }
      if (attributes.resumeId) {
        var grantKey = await Profile.grantDocumentAccess(tokenset, attributes.resumeId, attributes.taskId);
        var encryptedKey = crypto.encrypt(grantKey.Key);
        attributes.grantAccess = encryptedKey.data;
        attributes.iv = encryptedKey.iv;
        attributes.nonce = grantKey.Nonce;
      }
    }
    return await dao.Volunteer.update(attributes).then(async (volunteer) => {      
      return done(null, volunteer);
    }).catch((err) => {
      log.error(err);
      return done({ message: 'An unexpected error occured trying to update your application.'});
    });
  }).catch((err) => {
    log.error(err);
    return done({ message: 'An unexpected error occured trying to update your application.'});
  });
}


async function sendDeletedVolunteerNotification (notificationInfo, action) {
  var data = {
    action: action,
    model: {
      task: { id: notificationInfo.id, title: notificationInfo.title },
      owner: { name: notificationInfo.ownername, username: notificationInfo.ownerusername, governmentUri: notificationInfo.ownergovernmentUri },
      user: { name: notificationInfo.name, username: notificationInfo.username, governmentUri: notificationInfo.governmentUri},
    },
  };
  data.model.community = await dao.Community.findOne('community_id = (select community_id from task where id = ?)', notificationInfo.id).catch(() => { return null; });
  if(!notificationInfo.bounced) {
    notification.createNotification(data);
  } 
}

module.exports = {
  addVolunteer: addVolunteer,
  deleteVolunteer: deleteVolunteer,
  assignVolunteer: assignVolunteer,
  volunteerComplete: volunteerComplete,
  canAddVolunteer: canAddVolunteer,
  canManageVolunteers: canManageVolunteers,
  sendAddedVolunteerNotification: sendAddedVolunteerNotification,
  sendDeletedVolunteerNotification: sendDeletedVolunteerNotification,
  selectVolunteer: selectVolunteer,
  getResumes: getResumes,
  getVolunteer: getVolunteer,
  updateVolunteer: updateVolunteer,
  getVolunteerResumeAccess: getVolunteerResumeAccess,
};
