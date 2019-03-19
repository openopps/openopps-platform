const db = require('../../../db');
const dao = require('./dao')(db);
const tamperProof = require('../../../utils/tamper-proof');

var service = {};

service.getApplicationSummary = async function (applicationId, sub, auth_time) {
  var results = (await dao.TaskListApplication.db.query(dao.query.ApplicantSummary, applicationId)).rows[0];
  if (results.transcript_id !== null) {
    results.transcript_key = tamperProof.Hmac([sub, auth_time, results.transcript_id].join('|'));
  }
  return results;
};
module.exports = service;