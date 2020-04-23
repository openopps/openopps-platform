const _ = require ('lodash');
const log = require('log')('app:volunteer:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');

async function addVolunteer (attributes, done) {
  var volunteer = await dao.Volunteer.find('"taskId" = ? and "userId" = ?', attributes.taskId, attributes.userId);
  if (volunteer.length == 0) {
    attributes.createdAt = new Date();
    attributes.updatedAt = new Date();
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
  if(!data.model.user.bounced) {
    notification.createNotification(data);
  }
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
};
