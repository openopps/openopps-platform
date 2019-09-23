const log = require('log')('app:autocomplete:service');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');

const codeTypes = {
  academicHonors: 'HONORS',
  degreeTypes: 'DEGREE_LEVEL',
  languageProficiencies: 'LANGUAGE_PROFICIENCY',
  referenceTypes: 'REFERENCE_TYPE' ,
  securityClearances: 'SECURITY_CLEARANCE',
};

module.exports = {};

module.exports.lookupCodesByCodeType = function (codeType) {
  return dao.Lookup.find('is_disabled = false and lookup_code_type = ?', codeTypes[codeType] || '', {
    exclude: ['is_disabled', 'sort_order', 'last_modified'],
  });
};