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

async function updateProfileTag (userId, tagType, tagName) {
  var currentTag = (await dao.TagEntity.db.query(dao.query.tagEntity, [tagType , userId])).rows[0] || {};
  if(tagName) {
    var newTag = await dao.TagEntity.findOne('type = ? and name = ?', [tagType, tagName]).catch(() => { return {}; });
    if(currentTag.tagentity_users != newTag.id) {
      await dao.UserTags.delete('id = ?', currentTag.id);
      await dao.UserTags.insert({ tagentity_users: newTag.id, user_tags: userId });
    } else if (_.isEmpty(newTag)) {
      await dao.TagEntity.insert({ type: tagType, name: tagName }).then(async (t) => {
        await dao.UserTags.insert({ tagentity_users: t.id, user_tags: userId });
      }).catch(err => {
        log.info('user: failed to create tag ', user.username, tag, err);
      });
    }
  } else {
    await dao.UserTags.delete('id = ?', currentTag.id);
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
  await updateProfileTag(user.id, 'career', profile.Profile.CareerField);
  var location = _.filter([profile.AddressCity, profile.AddressCountrySubdivision], _.identity).join(', ');
  await updateProfileTag(user.id, 'location', location);
  await dao.User.update(user);
  return user;
}

module.exports = {
  get: async (tokenset, callback) => {
    return new Promise((resolve, reject) => {
      request(_.extend(requestOptions, { auth: { 'bearer': tokenset.access_token } }), async (err, res) => {
        if(err || res.statusCode !== 200) {
          reject({ message: 'Error getting user profile.' });
        } else {
          resolve(JSON.parse(res.body));
        }
      });
    });
  },
  sync: async (user, tokenset, callback) => {
    await module.exports.get(tokenset).then(async (profile) => {
      user = await updateProfileData(user, profile, tokenset);
      user.access_token = tokenset.access_token,
      user.id_token = tokenset.id_token,
      callback(null, user);
    }).catch(callback);
  },
};