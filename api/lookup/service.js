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
  return dao.Lookup.find('lookup_code_type = ?', codeTypes[codeType] || '');
};