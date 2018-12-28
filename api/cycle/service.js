const _ = require ('lodash');
const log = require('log')('app:cycle:service');
const db = require('../../db');
const dao = require('./dao')(db);

module.exports = {};

module.exports.findById = function (cycleId) {
  return dao.Cycle.find('cycle_id = ?', cycleId);
};

module.exports.list = function (communityId) {
  return dao.Cycle.find('community_id = ?', communityId);
};