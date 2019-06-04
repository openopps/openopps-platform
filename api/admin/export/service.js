const _ = require ('lodash');
const log = require('log')('app:admin:service');
const db = require('../../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const Audit = require('../../model/Audit');
const opportunityService = require('./service');
const elasticService = require('../../../elastic/service');
const communityService = require('../../community/service');

module.exports = {};

module.exports.getExportTaskCommunityData = async function (user, communityId) {
    var records = (await dao.Task.db.query(dao.query.exportTaskCommunityData, communityId)).rows;
    var fieldNames = _.keys(dao.exportTaskFormat);
    var fields = _.values(dao.exportTaskFormat);

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

module.exports.getExportData = async function (target, id) {
    var records;
    if (target === 'agency') {
      records = (await dao.User.db.query(dao.query.exportUserAgencyData, id)).rows;
    } else if (target === 'community') {
      records = (await dao.User.db.query(dao.query.exportUserCommunityData, id)).rows;
    } else {
      records = (await dao.User.db.query(dao.query.exportUserData)).rows;
    }
    var fieldNames = _.keys(dao.exportFormat);
    var fields = _.values(dao.exportFormat);
  
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