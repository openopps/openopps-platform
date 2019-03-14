const db = require('../../../db');
const dao = require('./dao')(db);

var service = {};

service.getApplicationSummary = async function (applicationId) {
  var results = (await dao.TaskListApplication.db.query(dao.query.ApplicantSummary, applicationId)).rows[0];
  return results;
};
module.exports = service;