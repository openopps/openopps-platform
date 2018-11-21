const _ = require ('lodash');
const log = require('log')('app:community:service');
const db = require('../../db');
const dao = require('./dao')(db);
const Audit = require('../model/Audit');

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

module.exports.createAudit = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.findById = async function (id, callback) {
  return dao.Community.findOne('community_id = ?', id).then(async (community) => {
    community.communityType = communityTypes[community.communityType - 1];
    if(community.communityType && community.communityTypeValue) {
      community.communityTypeValue = await dao.TagEntity.findOne('id = ? and type = ?', [community.communityTypeValue, community.communityType.toLowerCase()]).catch(() => { return null; });
    }
    community.duration = durationTypes[community.duration - 1];
    community.targetAudience = audienceTypes[community.targetAudience - 1];
    callback(community);
  }).catch(err => {
    log.info('Cannot find community by id ' + id, err);
    callback(null);
  });
};

module.exports.isCommunityManager = async function (user, communityId) {
  if(user.isAdmin) {
    return true;
  } else {
    var communityUser = await dao.CommunityUser.findOne('user_id = ? and community_id = ?', [user.id, communityId]).catch(() => { return null; });
    return communityUser && communityUser.isManager;
  }
};