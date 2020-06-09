const _ = require('lodash');
const log = require('log')('app:co-owner:service');
const db = require('../../db/client');
const auth = require('../auth/auth');
const Audit = require('../model/Audit');

module.exports = {};

/**
 * @param {Number} userId id of user adding the co-owner(s)
 * @param {Number} taskId id of opportunity co-owner(s) are being added to
 * @param {Array<Number>} coOwners list of user ids of co-owners being added
 */
module.exports.addCoOwners = function (userId, taskId, coOwners) {
  return new Promise((resolve, reject) => {
    var entries = [].concat(coOwners).map(id => { return { task_id: taskId, user_id: id, created_by: userId }; });
    db.insert('co_owners', entries).then(() => {
      // TODO: audit co-owner additions
      resolve();
    }).catch(reject);
  });
};

/**
 * Permission middleware check
 */
module.exports.canManageCoOwners = async function (ctx, next) {
  if (ctx.state.user.isAdmin) {
    await next();
  } else {
    await db.query({
      text: 'SELECT * FROM task WHERE "userId" = $1 and id = $2',
      values: [ctx.state.user.id, ctx.request.body.taskId],
    }).then(async results => {
      results.rows.length > 0 ? await next(): await auth.forbidden(ctx);
    }).catch(err => {
      log.error(err);
      ctx.status = 401;
      ctx.body = { message: 'Unexpected error was encounted trying to add co-owners.' };
    });
  }
};

/**
 * @param {Number} userId id of user adding the co-owner(s)
 * @param {Number} taskId id of opportunity to change primary on
 * @param {Array<Number>} coOwnerId primary key of co-owner record being made primary
 */
module.exports.changePrimaryCoOwner = function (ctx, taskId, coOwnerId) {
  return new Promise((resolve, reject) => {
    Promise.all([
      db.query('SELECT "userId" FROM task WHERE id = $1', [taskId]),
      db.query('SELECT * FROM co_owner WHERE co_owner_id = $1', [coOwnerId]),
    ]).then(results => {
      var task = results[0].rows[0];
      var coOwner = results[1].rows[0];
      if(!task || !coOwner || coOwner.task_id != taskId) {
        reject(new Error('Bad request for task id ' + taskId));
      } else {
        db.transaction([
          { text: 'UPDATE task SET "userId" = $1 WHERE id = $2', values: [coOwner.user_id, taskId]},
          { text: 'DELETE FROM co_owner WHERE co_owner_id = $1', values: [coOwnerId]},
          { text: 'INSERT INTO co_owner (task_id, user_id, created_by) VALUES ($1, $2, $3)', values: [taskId, task.userId, ctx.state.user.id]},
        ]).then(() => {
          this.createAuditLog('PRIMARY_CO_OWNER_CHANGED', ctx, {
            taskId: taskId,
            previousPrimary: task.userId,
            newPrimary: coOwner.user_id,
          });
          resolve();
        }).catch(reject);
      }
    }).catch(reject);
  });
};

module.exports.createAuditLog = function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  return new Promise(resolve => {
    db.insert('audit_log', audit).then(() => {
      resolve(true);
    }).catch(err => {
      log.error(err);
      resolve(false);
    });
  });
};

/**
 * @param {Number} userId id of user removing the co-owner
 * @param {Number} coOwnerId primary key of co-owner record being removed
 */
module.exports.deleteCoOwner = function (userId, coOwnerId) {
  return new Promise((resolve, reject) => {
    db.query({
      text: 'DELETE FROM co_owner WHERE co_owner_id = $1',
      values: [coOwnerId],
    }).then(() => {
      // TODO: Audit co-owner removal
      resolve();
    }).catch(reject);
  });
};

/**
 * @param {Number} taskId primary key of the opportunity
 */
module.exports.getCoOwners = function (taskId) {
  return new Promise((resolve, reject) => {
    db.query({
      text: `SELECT co_owner.co_owner_id, co_owner.user_id, midas_user.name, midas_user."photoId"
        FROM co_owner
        JOIN midas_user on midas_user.id = co_owner.user_id
        WHERE co_owner.task_id = $1`,
      values: [taskId],
    }).then(results => {
      resolve(results.rows);
    }).catch(reject);
  });
};