const db = require('../../db');
const dao = require('./dao')(db);
const log = require('log')('app:user:service');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const User = require('../model/User');
const Audit = require('../model/Audit');

async function findOne (id) {
  return await dao.User.findOne('id = ?', id).catch(err => {
    return null;
  });
}

async function findOneByUsername (username, done) {
  await dao.User.find('username = ?', username).then(users => {
    done(null, users[0]);
  }).catch(err => {
    done(err);
  });
}

async function isUsernameUsed (id, username) {
  return await dao.User.find('id != ? and username = ?', id, username);
}

async function getProfile (id) {
  var profile = await findOne(id).catch((err) => { return undefined; });
  if(profile) {
    profile.badges = dao.clean.badge(await dao.Badge.find('"user" = ?', id));
    profile.tags = (await dao.TagEntity.db.query(dao.query.tag, id)).rows;
    profile.agency = await dao.Agency.findOne('agency_id = ?', profile.agencyId).catch(() => { return undefined; });
    profile.communityApprover = await dao.CommunityUser.find('user_id = ? and is_approver = ?', id, true);
    profile.isCommunityApprover = profile.communityApprover.length > 0;
    return dao.clean.profile(profile);
  } else {
    return undefined;
  }
}

async function populateBadgeDescriptions (user) {
  user.badges = dao.clean.badge(user.badges);
  return user;
}

async function getActivities (id) {
  return {
    tasks: {
      created: dao.clean.activity(await dao.Task.find('"userId" = ?', id)),
      volunteered: (await dao.Task.db.query(dao.query.participated, id)).rows,
    },
  };
}

async function getCompletedInternship (userId) {
  return (await dao.Application.find('internship_completed_at is not null and user_id = ?', userId).catch(() => { return []; })).length;
}

async function getInternshipsActivities (userId) {
  return {
    applications: (await dao.Application.db.query(dao.query.applicationStatus, userId)).rows,
    savedOpportunities: (await db.query(dao.query.savedTask, userId)).rows,
  };
}

function processUserTags (user, tags) {
  return Promise.all(tags.map(async (tag) => {
    if(!_.isNaN(_.parseInt(tag))) {
      return await createUserTag(tag, user);
    } else {
      _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
      tag = _.pickBy(tag, _.identity);
      if (tag.id) {
        return await createUserTag(tag.id, user);
      } else {
        return await createNewUserTag(tag, user);
      }
    }
  }));
}

async function createNewUserTag (tag, user) {
  tag.name = tag.name.trim();
  return await dao.TagEntity.insert(tag).then(async (t) => {
    return await createUserTag(t.id, user);
  }).catch(err => {
    log.info('user: failed to create tag ', user.username, tag, err);
  });
}

async function createUserTag (tagId, user) {
  return await dao.UserTags.insert({ tagentity_users: tagId, user_tags: user.id }).then(async (tag) => {
    return await dao.TagEntity.findOne('id = ?', tag.tagentity_users).catch(err => {
      log.info('user: failed to load tag entity ', user.id, tagId, err);
    });
  }).catch(err => {
    log.info('user: failed to create tag ', user.username, tagId, err);
  });
}

async function updateProfile (attributes, done) {
  var errors = await User.validateUser(attributes, isUsernameUsed);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors);
  }
  attributes.updatedAt = new Date();
  var origUser = await dao.User.findOne('id = ?', attributes.id).catch(() => { return {}; });
  if(origUser && origUser.username !== attributes.username) {
    attributes.bounced = false; // email has been updated so we can reset the bounced flag
  }
  await dao.User.update(attributes).then(async (user) => {
    await dao.UserTags.db.query(dao.query.deleteUserTags, attributes.id)
      .then(async () => {
        var tags = [].concat(attributes.tags || attributes['tags[]'] || []).filter((tag) => {
          return (tag.type != 'skill' && tag.type != 'topic');
        });
        await processUserTags(user, tags).then(tags => {
          user.tags = tags;
        });
        user.agency = await dao.Agency.findOne('agency_id = ?', user.agencyId).catch(() => { return undefined; });
        return done(null, user);
      }).catch (err => { return done({'message':'Error updating profile.'}); });
  }).catch (err => { return done({'message':'Error updating profile.'}); });
}


async function saveUserBureauOffice (userId,attributes,done) {   
  attributes.createdAt= new Date();
  attributes.updatedAt = new Date();
  await dao.UserBureauOffice.insert(attributes).then(async (data) => {
    data.bureauOffice= (await db.query(dao.query.userBureauOffice, userId)).rows;  
    data.bureau = await dao.Bureau.findOne('bureau_id = ?', data.bureauId).catch(() => { return {}; });
    data.office =await dao.Office.findOne('office_id = ?', data.officeId).catch(() => { return {}; }); 
    data.user =await dao.User.findOne('id = ?', userId).catch(() => { return {}; }); 
    data.insertSuccess= true; 
    return done(null, data);
  }).catch(err => {
    return done(true);
  });
  
}
async function deleteUserBureauOffice (userId,userBureauOfficeId){
  return await dao.UserBureauOffice.findOne('user_id = ? and user_bureau_office_id = ? ', userId,userBureauOfficeId).then(async (e) => { 
    return await dao.UserBureauOffice.delete('user_id = ? and user_bureau_office_id = ? ', userId,userBureauOfficeId).then(async (data) => {         
      return data;
    }).catch(err => {
      log.info('delete: failed to delete UserBureauOffice ', err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

async function saveUserBadge (ctx,userId,attributes,done) {   
  attributes.createdAt= new Date();
  attributes.updatedAt = new Date();
  attributes.user = userId;
  await dao.Badge.insert(attributes).then(async (data) => {  
    data.insertBadgeSuccess= true;
    await createAudit('BADGE_ADDED', ctx, {      
      badgeType: data.type,
      badgeUser :_.pick(await dao.User.findOne('id = ?', data.user), 'id', 'name', 'username'),
      user: _.pick(await dao.User.findOne('id = ?', ctx.state.user.id), 'id', 'name', 'username'),     
    });    
    return done(null, data);
  }).catch(err => {
    return done(true);
  });  
}

async function deleteUserBadge (ctx,userId,type){
  return await dao.Badge.findOne('"user"= ? and "type"= ?', userId,type).then(async (e) => { 
    return await dao.Badge.delete('"user"= ? and "type"= ?', userId,type).then(async (data) => { 
      await createAudit('BADGE_DELETED', ctx, {      
        badgeType: type,
        badgeUser :_.pick(await dao.User.findOne('id = ?', userId), 'id', 'name', 'username'),
        user: _.pick(await dao.User.findOne('id = ?', ctx.state.user.id), 'id', 'name', 'username'),     
      });          
      return data;
    }).catch(err => {
      log.info('delete: failed to delete Badge ', err);
      return false;
    });
  }).catch((err) => {
    log.error(err);
    return false;
  });
}

async function updateSkills (attributes, done) {
  attributes.tags=JSON.parse(attributes.tags);
  var errors = User.validateTags({ invalidAttributes: {} }, attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors);
  }
  await dao.UserTags.db.query(dao.query.deleteSkillTags, attributes.id).then(async () => {
    var tags = [].concat(attributes.tags || attributes['tags[]'] || []);
    await processUserTags({ id: attributes.id, username: attributes.username }, tags).then(result => {
      tags = result;
    });
    return done(null, tags);
  }).catch (err => { 
    return done({'message':'Error updating skills.'});
  });
}
  
async function updateProfileStatus (ctx, opts, done) {
  if (await canAdministerAccount(opts.user, { id: opts.id })) {
    var user = await getProfile(opts.id);
    user.disabled = opts.disable ? 't' : 'f';
    user.updatedAt = new Date();
    var auditData = { userId: opts.id, action: opts.disable ? 'disable' : 'enable' };
    await dao.User.update(user).then(async (result) => {
      await createAudit('ACCOUNT_ENABLED_DISABLED', ctx, _.extend(auditData, { status: 'successful' }));
      return done(result, null);
    }).catch (async (err) => {
      log.info('Error updating profile status', err);
      await createAudit('ACCOUNT_ENABLED_DISABLED', ctx, _.extend(auditData, { status: 'failed' }));
      return done(null, { 'message': 'Error updating profile status' });
    });
  } else {
    await createAudit('UNATHORIZED_ACCOUNT_ENABLED_DISABLED', ctx, _.extend(auditData, { status: 'blocked' }));
    done(null, {'message': 'Forbidden'});
  }
}

async function canUpdateProfile (ctx) {
  if (ctx.params.id == ctx.request.body.id) {
    if (ctx.state.user.isAdmin ||
       (ctx.state.user.isAgencyAdmin && checkAgency(ctx.state.user, ctx.params) && await checkRoleEscalation(ctx.request.body)) ||
       (ctx.state.user.id == ctx.params.id && await checkRoleEscalation(ctx.request.body))) {
      return true;
    }
  }
  return false;
}

async function checkRoleEscalation (attributes) {
  var owner = await dao.User.find('id = ?', attributes.id);
  if (owner.length > 0) {
    if (_.has(attributes, 'isAdmin') && !owner[0].isAdmin) {
      return false;
    }
    if (_.has(attributes, 'isAgencyAdmin') && !owner[0].isAgencyAdmin) {
      return false;
    }
  }
  return true;
}

async function canAdministerAccount (user, attributes) {
  if ((_.has(user, 'isAdmin') && user.isAdmin) || (user.isAgencyAdmin && await checkAgency(user, attributes))) {
    return true;
  }
  return false;
}

async function checkAgency (agencyAdmin, attributes) {
  var user = await dao.User.findOne('id = ?', attributes.id).catch(() => { return {};});
  return !user.isAdmin && agencyAdmin.agencyId == user.agencyId;
}

async function updatePassword (attributes) {
  await updateProfilePasswordAttempts(attributes.id);
  attributes.password = await bcrypt.hash(attributes.password, 10);
  attributes.id = (await dao.Passport.find('"user" = ?', attributes.id))[0].id;
  attributes.updatedAt = new Date();
  await dao.Passport.update(attributes);
  return true;
}

async function updateProfilePasswordAttempts (id) {
  var user = (await dao.User.find('id = ?', id))[0];
  user.passwordAttempts = 0;
  return dao.User.update(user);
}

async function updatePhotoId (id) {
  var user = (await dao.User.find('id = ?', id))[0];
  user.photoId = null;
  user.updatedAt = new Date();
  return dao.User.update(user);
}

async function createAudit (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
}

module.exports = {
  createAudit: createAudit,
  findOne: findOne,
  findOneByUsername: findOneByUsername,
  getProfile: getProfile,
  populateBadgeDescriptions: populateBadgeDescriptions,
  getActivities: getActivities,
  getCompletedInternship: getCompletedInternship,
  getInternshipsActivities: getInternshipsActivities,
  updateProfile: updateProfile,
  updateProfileStatus: updateProfileStatus,
  updatePassword: updatePassword,
  updateSkills: updateSkills,
  processUserTags: processUserTags,
  canAdministerAccount: canAdministerAccount,
  canUpdateProfile: canUpdateProfile,
  updatePhotoId: updatePhotoId,
  saveUserBureauOffice :saveUserBureauOffice,  
  deleteUserBureauOffice : deleteUserBureauOffice,
  saveUserBadge :saveUserBadge,
  deleteUserBadge: deleteUserBadge,
};
