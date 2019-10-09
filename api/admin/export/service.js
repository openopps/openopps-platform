const _ = require ('lodash');
const log = require('log')('app:admin:service');
const db = require('../../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const Audit = require('../../model/Audit');
const fs = require('fs');

module.exports = {};

module.exports.lookupAgency = async function (agencyId) {
  return (await db.query('select name from agency where agency_id = ?', agencyId)).rows[0];
};

module.exports.createAuditLog = async function (type, ctx, auditData) {
  var audit = Audit.createAudit(type, ctx, auditData);
  await dao.AuditLog.insert(audit).catch(() => {});
};

module.exports.getExportData = async function (type, target, id, cycleId) {
  var records;
  var fieldNames;
  var fields;
  var communityRefId = ((await db.query('select reference_id from community where community_id = ?', id)).rows[0] || {}).reference_id;
  if (type === 'task') {
    if (target === 'agency') {
      records = (await dao.Task.db.query(dao.query.exportTaskAgencyData, id)).rows;
    } else if (target === 'community') {
      records = (await dao.Task.db.query(dao.query.exportTaskCommunityData, id)).rows;
      if (communityRefId == 'dos') {
        records = (await dao.Task.db.query(dao.query.exportTaskDoSCommunityData, id, cycleId)).rows;
      }
    } else {
      records = (await dao.Task.db.query(dao.query.exportTaskData)).rows;
    }
    if (communityRefId != 'dos') {
      var exportTaskFormat = _.omit(dao.exportTaskFormat, ['office', 'bureau']);
    }
    if (target != 'sitewide') {
      var exportTaskFormat = _.omit(exportTaskFormat || dao.exportTaskFormat, 'community_name');
    }
    fieldNames = _.keys(exportTaskFormat || dao.exportTaskFormat);
    fields = _.values(exportTaskFormat || dao.exportTaskFormat);
  } else if (type === 'user') {
    if (target === 'agency') {
      records = (await dao.User.db.query(dao.query.exportUserAgencyData, id)).rows;
    } else if (target === 'community') {
      records = (await dao.User.db.query(dao.query.exportUserCommunityData, id)).rows;
    } else {
      records = (await dao.User.db.query(dao.query.exportUserData)).rows;
    }
    if (target !== 'community') {
      var exportUserFormat = _.omit(dao.exportUserFormat, ['joined_community']);
    }
    fieldNames = _.keys(exportUserFormat || dao.exportUserFormat);
    fields = _.values(exportUserFormat || dao.exportUserFormat);
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
      fieldNames = _.keys(dao.exportTopContributorParticipantFormat);
      fields = _.values(dao.exportTopContributorParticipantFormat);
    } else if (target === 'created') {
      var topAgencyCreated = fs.readFileSync(__dirname + '/sql/getTopAgencyCreatedExport.sql', 'utf8');  
      records= (await db.query(topAgencyCreated, [FY.start, FY.end])).rows;
      fieldNames = _.keys(dao.exportTopContributorCreatedFormat);
      fields = _.values(dao.exportTopContributorCreatedFormat);
    } else if (target === 'agency-created') {
      var topCreated = fs.readFileSync(__dirname + '/sql/getTopCreatedExport.sql', 'utf8');  
      records= (await db.query(topCreated, [id, FY.start, FY.end])).rows;
      fieldNames = _.keys(dao.exportTopContributorAgencyCreatedFormat);
      fields = _.values(dao.exportTopContributorAgencyCreatedFormat);
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