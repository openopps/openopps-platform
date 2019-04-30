const _ = require ('lodash');
const log = require('log')('app:cycle:service');
const db = require('../../db');
const dao = require('./dao')(db);
const Audit = require('../model/Audit');
const moment = require('moment-timezone');

async function findCycleApplyOverlap (data) {
  var cycles = await dao.Cycle.find('community_id = ?', data.communityId);
  var startDate = new Date(data.applyStartDate);
  var endDate = new Date(data.applyEndDate);
  return _.filter(cycles, cycle => {
    var cycleStartDate = new Date(cycle.applyStartDate);
    var cycleEndDate = new Date(cycle.applyEndDate);
    return cycle.cycleId != data.cycleId && startDate <= cycleEndDate && cycleStartDate <= endDate;
  })[0];
}

function forceEasternTimezone (data) {
  Object.keys(data).forEach(key => {
    if(key.match(/.*Date$/)) {
      data[key] = moment(data[key]).tz('America/New_York').toISOString();
    }
  })
}

module.exports = {};

module.exports.addCycle = async function (data, callback) {
  forceEasternTimezone(data);
  var cycleOverlap = await findCycleApplyOverlap(data);
  if (cycleOverlap) {
    callback(null, { message: 'The apply dates for cycle <b>' + data.name + '</b> overlap with the apply dates for cycle <b>' + cycleOverlap.name + '</b>'});
  } else {
    await dao.Cycle.insert(_.extend(data, {
      createdAt: new Date(),
      updatedAt: new Date(),
    })).then((cycle) => {
      callback(cycle);
    }).catch((err) => {
      log.error('An error was encountered trying to create a cycle', err);
      callback(null, { message: 'An error was encountered trying to add this cycle to the community.' });
    });
  }
};

module.exports.createAudit = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.deleteCycle = async (communityId, cycleId, callback) => {
  await dao.Cycle.findOne('community_id = ? and cycle_id = ?', communityId, cycleId).then(async (cycle) => {
    await dao.Cycle.delete(cycle).then(() => {
      callback();
    }).catch((err) => {
      log.error('An error was encountered trying to delete a cycle', err);
    callback({ message: 'An error was encountered trying to delete this cycle.' });
    });
  }).catch((err) => {
    log.error('An error was encountered trying to delete a cycle', err);
    callback({ message: 'An error was encountered trying to delete this cycle.' });
  })
};

module.exports.findById = function (cycleId) {
  return dao.Cycle.find('cycle_id = ?', cycleId);
};

module.exports.getAll = function () {
  return dao.Cycle.find();
}

module.exports.list = function (communityId) {
  return dao.Cycle.find('community_id = ?', communityId);
};

module.exports.updateCycle = async (data, callback) => {
  forceEasternTimezone(data);
  await dao.Cycle.findOne('community_id = ? and cycle_id = ?', data.communityId, data.cycleId).then(async () => {
    var cycleOverlap = await findCycleApplyOverlap(data);
    if (cycleOverlap) {
      callback(null, { message: 'The apply dates for cycle <b>' + data.name + '</b> overlap with the apply dates for cycle <b>' + cycleOverlap.name + '</b>'});
    } else {
      await dao.Cycle.update(data).then((cycle) => {
        callback(cycle);
      }).catch((err) => {
        log.error('An error was encountered trying to update a cycle', err);
        callback(null, { message: 'An error was encountered trying to update this cycle.' });
      });
    }
  }).catch((err) => {
    log.error('An error was encountered trying to update a cycle', err);
    callback(null, { message: 'An error was encountered trying to update this cycle.' });
  })
};