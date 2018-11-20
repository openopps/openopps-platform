const _ = require ('lodash');
const log = require('log')('app:community:service');
const db = require('../../db');
const dao = require('./dao')(db);

const communityTypes = [ 'Career', 'Program' ];
const durationTypes = [ 'Ad Hoc', 'Cyclical' ];
const audienceTypes = [ 'Federal Employees', 'Students' ];

module.exports = { };

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