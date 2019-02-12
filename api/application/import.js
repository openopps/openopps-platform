const _ = require ('lodash');
const log = require('log')('app:application:import');
const db = require('../../db');
const dao = require('./dao')(db);

function fixUpperCaseAttributeNames (object) {
  Object.keys(object).forEach((key) => { 
    object[key.charAt(0).toLowerCase() + key.substr(1)] = object[key];
  });
  return object;
}

module.exports = {};

module.exports.profileEducation = (userId, applicationId, educationRecords) => {
  return Promise.all(_.map(educationRecords, async (record) => {
    var education = _.extend(fixUpperCaseAttributeNames(record), {
      userId: userId,
      applicationId: applicationId,
      countryId: (await dao.Country.findOne('code = ?', record.CountryCode).catch(() => { return {}; })).countryId,
      countrySubdivisionId : (await dao.CountrySubdivision.findOne('parent_code = ? and code = ?', record.CountryCode, record.CountrySubdivisionCode).catch(() => { return {}; })).countrySubdivisionId,
      degreeLevelId: (await dao.LookupCode.findOne('lookup_code_type = ? and code = ?', 'DEGREE_LEVEL', record.DegreeLevelCode).catch(() => { return {}; })).lookupCodeId,
      honorsId: (await dao.LookupCode.findOne('lookup_code_type = ? and code = ?', 'HONORS', record.HonorsCode).catch(() => { return null; })).lookupCodeId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return dao.Education.insert(education);
  }));
};

module.exports.profileExperience = (userId, applicationId, experienceRecords) => {
  return Promise.all(_.map(experienceRecords, async (record) => {
    var experience = _.extend(fixUpperCaseAttributeNames(record), {
      userId: userId,
      applicationId: applicationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return dao.Experience.insert(experience);
  }));
};

module.exports.profileReferences = (userId, applicationId, experienceRecords) => {
  return Promise.all(_.map(experienceRecords, async (record) => {
    var experience = _.extend(fixUpperCaseAttributeNames(record), {
      userId: userId,
      applicationId: applicationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return dao.Experience.insert(experience);
  }));
};