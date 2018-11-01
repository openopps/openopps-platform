const log = require('log')('app:syncProfile');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');
const request = require('request');

const requestOptions = {
  url: openopps.auth.profileURL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

async function updateProfileCareer (userId, career) {
  var currentCareerTag = (await dao.TagEntity.db.query(dao.query.tagEntity, ['career' , userId])).rows[0] || {};
  if(career) {
    var newCareerTag = await dao.TagEntity.findOne('type = ? and name = ?', ['career', career]).catch(() => { return {}; });
    if(currentCareerTag.tagentity_users != newCareerTag.id) {
      await dao.UserTags.delete('id = ?', currentCareerTag.id);
      await dao.UserTags.insert({ tagentity_users: newCareerTag.id, user_tags: userId });
    }
  } else {
    await dao.UserTags.delete('id = ?', currentCareerTag.id);
  }
}

async function updateProfileData (user, profile, tokenset) {
  user.name = _.filter([profile.GivenName, profile.MiddleName, profile.LastName], _.identity).join(' ');
  user.givenName = profile.GivenName;
  user.middleName = profile.MiddleName;
  user.lastName = profile.LastName;
  user.title = profile.Profile.JobTitle;
  user.bio = profile.Profile.Biography;
  if (tokenset.claims) {
    user.linkedId = tokenset.claims.sub;
    user.governmentUri = tokenset.claims['usaj:governmentURI'];
  }
  user.agency = await dao.Agency.findOne('code = ?', profile.Profile.OrganizationCPDFCode).catch(() => { return {}; });
  user.agencyId = user.agency.agencyId;
  await updateProfileCareer(user.id, profile.Profile.CareerField);
  await dao.User.update(user);
  return user;
}

module.exports = async (user, tokenset, callback) => {
  requestOptions.auth = { 'bearer': tokenset.access_token };
  return new Promise((resolve, reject) => {
    request(requestOptions, async (err, res) => {
      if(err || res.statusCode !== 200) {
        reject({ message: 'Error getting user profile.' });
      } else {
        user = await updateProfileData(user, JSON.parse(res.body), tokenset);
        user.access_token = tokenset.access_token,
        user.id_token = tokenset.id_token,
        resolve(user);
      }
    });
  }).then(user => {
    callback(null, user);
  }).catch(callback);
};