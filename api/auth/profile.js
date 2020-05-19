const log = require('log')('app:syncProfile');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');
const request = require('request');
const elasticService = require('../../elastic/service');
const Agency = require('../model/Agency');

const requestOptions = {
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
  user.isUsCitizen = profile.Profile.IsUSCitizen;
  user.title = profile.Profile.JobTitle;
  user.bio = profile.Profile.Biography;
  var agency = await dao.Agency.findOne('code = ?', profile.Profile.OrganizationCPDFCode).catch(() => { return {}; });
  if (agency.agencyId) {
    user.agency = await Agency.fetchAgency(agency.agencyId).catch(() => { return {}; });
    user.agencies = Agency.toList(user.agency);
  }
  user.agencyId = agency.agencyId;
  await updateProfileTag(user.id, 'career', profile.Profile.CareerField);
  await dao.User.update(user);
  if (user.hiringPath == 'fed' ) {
    try {
      elasticService.indexUser(user.id);
    } catch (err) {}
  } else {
    try {
      elasticService.deleteUser(user.id);
    } catch (err) {}
  }
  return user;
}

function syncAutoJoinCommunities (user) {
  return new Promise(resolve => {
    var autoJoinCommunityQuery = `
      select
        community.community_id, community.agency_id, community.is_closed_group, community_user.community_user_id, community_user.user_id
      from community
      left join community_user on community_user.community_id = community.community_id and community_user.user_id = ?
      where community.is_closed_group = 'true' and auto_join = 'true'`;
    var agencyIds = Agency.toList(user.agency).map(agency => { return agency.agency_id; });
    db.query(autoJoinCommunityQuery, user.id).then(result => {
      Promise.all(result.rows.map(row => {
        var found = _.find(agencyIds, (id) => { return id == row.agency_id; });
        if (found && !row.community_user_id) {
          // Add community user record
          return dao.CommunityUser.insert({
            communityId: row.community_id,
            userId: user.id,
            isManager: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else if (!found && row.community_user_id) {
          // Remove community user record
          return dao.CommunityUser.delete('community_user_id = ?', row.community_user_id);
        }
      })).then(resolve).catch(err => {
        log.error(err);
        resolve();
      });
    }).catch(err => {
      log.error(err);
      resolve();
    });
  });
}

module.exports = {
  get: async (tokenset) => {
    return new Promise((resolve, reject) => {
      request(_.extend(requestOptions, { url: openopps.auth.profileURL, auth: { 'bearer': tokenset.access_token } }), async (err, res) => {
        if(err || res.statusCode !== 200) {
          reject({ message: 'Error getting user profile.' });
        } else {
          resolve(JSON.parse(res.body));
        }
      });
    });
  },
  getDocuments: async (tokenset, documentType) => {
    return new Promise((resolve, reject) => {
      request(_.extend(requestOptions, { 
        url: openopps.auth.profileDocumentURL + (documentType ? '/' + documentType : ''),
        auth: { 'bearer': tokenset.access_token },
      }), async (err, res) => {
        if(err || res.statusCode !== 200) {
          reject({ message: 'Error getting user documents.' });
        } else {
          resolve(JSON.parse(res.body));
        }
      });
    });
  },
  sync: async (user, tokenset, callback) => {
    await module.exports.get(tokenset).then(async (profile) => {
      user = await updateProfileData(user, profile, tokenset);
      await syncAutoJoinCommunities(user);
      callback(null, user);
    }).catch(callback);
  },
};
