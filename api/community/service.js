const _ = require ('lodash');
const log = require('log')('app:community:service');
const db = require('../../db');
const dao = require('./dao')(db);
const Audit = require('../model/Audit');
const Notification = require('../notification/service');

const communityTypes = [ 'Career', 'Program' ];
const durationTypes = [ 'Ad Hoc', 'Cyclical' ];
const audienceTypes = [ 'Federal Employees', 'Students' ];

module.exports = { };

module.exports.addCommunityMember = async function (data, callback) {
  await dao.CommunityUser.findOne('user_id = ? and community_id = ?', [data.userId, data.communityId]).then(() => {
    callback({ message: 'This user is already a member of the community.' });
  }).catch(async () => { 
    await dao.CommunityUser.insert(_.extend(data, {
      createdAt: new Date(),
      updatedAt: new Date(),
      isManager: false,
    })).then(() => { 
      callback();
    }).catch((err) => { 
      callback({ message: 'An error was encountered trying to add this user as a member to the community.' });
    });
  });
};

module.exports.getCommunities = async function (userId) {
  var communities = await dao.Community.query(dao.query.communitiesQuery, userId);
  var communityTypes = {
    federal: _.filter(communities, { targetAudience: 1 }),
    student: _.filter(communities, { targetAudience: 2 }),
  };
  return communityTypes;
}

module.exports.createAudit = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.detailsByAudienceType = async function (audienceType) {
  var targetAudience = _.findIndex(audienceTypes, (type) => { return type.toLowerCase() == audienceType.toLowerCase(); }) + 1;
  return await dao.Community.query(dao.query.communityDetails, targetAudience, { 
    fetch: { cycles: [] },
    exclude: { cycles: ['posting_start_date', 'posting_end_date', 'cycle_start_date', 'cycle_end_date', 'created_at', 'updated_at', 'updated_by'] },
  }).catch(err => {
    log.error(err);
  });
};

module.exports.findById = async function (id) {
  var community = await dao.Community.findOne('community_id = ?', id).catch(() => { return null; });
  if(community) { 
    community.communityType = communityTypes[community.communityType - 1];
    if(community.communityType && community.communityTypeValue) {
      community.communityTypeValue = await dao.TagEntity.findOne('id = ? and type = ?', [community.communityTypeValue, community.communityType.toLowerCase()]).catch(() => { return null; });
    }
    community.duration = durationTypes[community.duration - 1];
    community.targetAudience = audienceTypes[community.targetAudience - 1];
  }
  return community;
};

module.exports.getActiveCycles = async function (communityId) {
  var currentDate = moment.tz('America/New_York');
  return await dao.Cycle.find('community_id = ? and posting_start_date <= ? and posting_end_date >= ?', [communityId, currentDate, currentDate]);
};

module.exports.isCommunityManager = async function (user, communityId) {
  if(user.isAdmin) {
    return true;
  } else {
    var communityUser = await dao.CommunityUser.findOne('user_id = ? and community_id = ?', [user.id, communityId]).catch(() => { return null; });
    return communityUser && communityUser.isManager;
  }
};

module.exports.sendCommunityInviteNotification = async function (admin, data) {
  try {
    var community = await dao.Community.findOne('community_id = ?', data.communityId);
    var user = await dao.User.findOne('id = ?', data.userId);
    if(!user.bounced) {
      Notification.createNotification({
        action: 'community.user.invite',
        model: {
          community: community,
          user: user,
          admin: admin,
        },
      });
    }
  } catch (err) {
    log.error('Unable to email community invitation notification', err);
  }
};