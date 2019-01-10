const _ = require ('lodash');
const log = require('log')('app:cycle:service');
const db = require('../../db');
const dao = require('./dao')(db);
const Audit = require('../model/Audit');

module.exports = {};

module.exports.addCycle = async function (data, callback) {
  await dao.Cycle.insert(_.extend(data, {
    createdAt: new Date(),
    updatedAt: new Date(),
  })).then((cycle) => {
    callback(cycle);
  }).catch((err) => {
    log.error('An error was encountered trying to create a cycle', err);
    callback(null, { message: 'An error was encountered trying to add this cycle to the community.' });
  });
};

module.exports.createAudit = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.findById = function (cycleId) {
  return dao.Cycle.find('cycle_id = ?', cycleId);
};

module.exports.list = function (communityId) {
  return dao.Cycle.find('community_id = ?', communityId);
};