const _ = require ('lodash');
const log = require('log')('app:admin:service');
const db = require('../../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const Audit = require('../../model/Audit');
const fs = require('fs');

module.exports = {};

module.exports.createAuditLog = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.getExportData = async function (type, target, id) {
  var records;
  var fieldNames;
  var fields;
  if (type === 'task') {
    if (target === 'agency') {
      records = (await dao.Task.db.query(dao.query.exportTaskAgencyData, id)).rows;
    } else if (target === 'community') {
      records = (await dao.Task.db.query(dao.query.exportTaskCommunityData, id)).rows;
    } else {
      records = (await dao.Task.db.query(dao.query.exportTaskData)).rows;
    }
    fieldNames = _.keys(dao.exportTaskFormat);
    fields = _.values(dao.exportTaskFormat);
  } else if (type === 'user') {
    if (target === 'agency') {
      records = (await dao.User.db.query(dao.query.exportUserAgencyData, id)).rows;
    } else if (target === 'community') {
      records = (await dao.User.db.query(dao.query.exportUserCommunityData, id)).rows;
    } else {
      records = (await dao.User.db.query(dao.query.exportUserData)).rows;
    }
    fieldNames = _.keys(dao.exportUserFormat);
    fields = _.values(dao.exportUserFormat);
  }
  else if (type === 'TopContributor') {
    var today = new Date();
    var FY = {};
    if (today.getMonth() < 9) {
      FY.start = [today.getFullYear() - 1, 10, 1].join('-');
      FY.end = [today.getFullYear(), 09, 30].join('-');
    } else {
      FY.start = [today.getFullYear(), 10, 1].join('-');
      FY.end = [today.getFullYear() + 1, 09, 30].join('-');
    }
    if (target === 'participant') {
      var topAgencyParticipants = fs.readFileSync(__dirname + '/sql/getTopAgencyParticipantsExport.sql', 'utf8');  
      records= (await db.query(topAgencyParticipants, [FY.start, FY.end])).rows;
      fieldNames = _.keys(dao.exportTopContributorFormat);
      fields = _.values(dao.exportTopContributorFormat);
    } 
  }
  fields.forEach(function (field, fIndex, fields) {
    if (typeof(field) === 'object') {      
      records.forEach(function (rec, rIndex, records) {
        records[rIndex][field.field] = field.filter.call(this, rec[field.field]);
      });
      fields[fIndex] = field.field;   
    }  
  });
  return json2csv({
    data: records,
    fields: fields,
    fieldNames: fieldNames,
  });
};