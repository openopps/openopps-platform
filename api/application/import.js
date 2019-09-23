const _ = require ('lodash');
const log = require('log')('app:application:import');
const db = require('../../db');
const dao = require('./dao')(db);

function fixUpperCaseAttributeNames (object) {
  var newObject = {};
  Object.keys(object).forEach((key) => { 
    newObject[key.charAt(0).toLowerCase() + key.substr(1)] = object[key];
  });
  return newObject;
}

function recordError (userId, err) {
  dao.ErrorLog.insert({
    userId: userId,
    errorData: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))),
  }).catch();
}

module.exports = {};

module.exports.profileEducation = (userId, applicationId, educationRecords) => {
  return Promise.all(_.map(educationRecords, async (record) => {
    try {
      var education = _.extend(fixUpperCaseAttributeNames(record), {
        userId: userId,
        applicationId: applicationId,
        countryId: (await dao.Country.findOne('code = ?', record.CountryCode).catch(() => { return {}; })).countryId,
        countrySubdivisionId : (await dao.CountrySubdivision.findOne('parent_code = ? and code = ?', record.CountryCode, record.CountrySubdivisionCode).catch(() => { return {}; })).countrySubdivisionId,
        degreeLevelId: (await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'DEGREE_LEVEL', record.DegreeLevelCode).catch(() => { return {}; })).lookupCodeId,
        honorsId: record.HonorsCode? ((await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'HONORS', record.HonorsCode).catch(() => { return null; })).lookupCodeId):null,      
        gpa:record.GPA ? record.GPA : '',
        gpaMax:record.GPAMax ? record.GPAMax :'',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return dao.Education.insert(education);
    } catch (err) {
      recordError(userId, err);
      return { err: 'An error occurred trying to import profile data.' };
    }
  }));
};

module.exports.profileExperience = (userId, applicationId, experienceRecords) => {
  return Promise.all(_.map(experienceRecords, async (record) => {
    try {
      var experience = _.extend(fixUpperCaseAttributeNames(record), {
        userId: userId,
        applicationId: applicationId,
        countryId: (await dao.Country.findOne('code = ?', record.CountryCode).catch(() => { return {}; })).countryId,
        countrySubdivisionId : (await dao.CountrySubdivision.findOne('parent_code = ? and code = ?', record.CountryCode, record.CountrySubdivisionCode).catch(() => { return {}; })).countrySubdivisionId,
        isPresent: record.EndDate ? false : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return dao.Experience.insert(experience);
    } catch (err) {
      recordError(userId, err);
      return { err: 'An error occurred trying to import profile data.' };
    }
  }));
};

module.exports.profileLanguages = (userId, applicationId, languageRecords) => {
  return Promise.all(_.map(languageRecords, async (record) => {
    try {
      var language = {
        userId: userId,
        applicationId: applicationId,
        languageId: (await dao.Language.findOne('code = ?', record.LanguageISOCode).catch(() => { return {}; })).languageId,
        readingProficiencyId: (await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'LANGUAGE_PROFICIENCY', record.ReadingProficiencyCode).catch(() => { return {}; })).lookupCodeId,
        speakingProficiencyId: (await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'LANGUAGE_PROFICIENCY', record.SpeakingProficiencyCode).catch(() => { return {}; })).lookupCodeId,
        writingProficiencyId: (await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'LANGUAGE_PROFICIENCY', record.WritingProficiencyCode).catch(() => { return {}; })).lookupCodeId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return dao.ApplicationLanguageSkill.insert(language);
    } catch (err) {
      recordError(userId, err);
      return { err: 'An error occurred trying to import profile data.' };
    }
  }));
};

module.exports.profileReferences = (userId, applicationId, referenceRecords) => {
  return Promise.all(_.map(referenceRecords, async (record) => {
    try {
      var reference = {
        userId: userId,
        applicationId: applicationId,
        referenceTypeId: (await dao.LookUpCode.findOne('lookup_code_type = ? and code = ?', 'REFERENCE_TYPE', record.TypeCode).catch(() => { return {}; })).lookupCodeId,
        referenceName: record.Name,
        referenceEmployer: record.Employer,
        referenceTitle: record.Title,
        referencePhone: record.Phone,
        referenceEmail: record.Email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return dao.Reference.insert(reference);
    } catch (err) {
      recordError(userId, err);
      return { err: 'An error occurred trying to import profile data.' };
    }
  }));
};

module.exports.profileSkills = (userId, applicationId, skillRecords) => {
  return Promise.all(_.map(skillRecords, async (record) => {
    try {
      var skill = {
        userId: userId,
        applicationId: applicationId,
        skillId: record.id,
        createdAt: new Date(),
      };
      var data = dao.ApplicationSkill.insert(skill);
      return data;
    } catch (err) {
      recordError(userId, err);
      return {err: 'An error occurred trying to import profile data.'};
    }
  }));
};