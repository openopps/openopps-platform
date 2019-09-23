const _ = require ('lodash');
const log = require('log')('app:announcement:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function getAnnouncement () {
  return (await dao.Announcement.find())[0] || {};
}

async function updateAnnouncement (announcement, userId, done) {
  announcement.userId = userId;
  announcement.updatedAt = new Date();
  if(!announcement.id) {
    announcement.createdAt = new Date();
    await dao.Announcement.insert(announcement).then(() => {
      done(null, true);
    }).catch (err => {
      done(err);
    });
  } else {
    await dao.Announcement.update(announcement).then(() => {
      done(null, true);
    }).catch (err => {
      done(err);
    });
  }
}

module.exports = {
  getAnnouncement: getAnnouncement,
  updateAnnouncement: updateAnnouncement,
};