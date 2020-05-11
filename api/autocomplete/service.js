const log = require('log')('app:autocomplete:service');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');

module.exports = { };

module.exports.tagByType = async function (type, name) {
  var query = dao.query.tagByType;
  query += name ? ' and lower(name) like ?' : '';
  var result = await dao.TagEntity.query(query, type, name ? '%' + name.toLowerCase() + '%' : '');
  return _.sortBy(result, 'data.sort', 'name').map(tag => {
    tag.field = 'name';
    tag.value = tag.name;
    
    return tag;
  });
};

module.exports.userByName =  async function (name) {
  var splitName = '%' + name.replace(/\s+/g, '%') + '%';
  var result = await dao.User.query(
    dao.query.userByName, name ? splitName : null
  );
  return result.map(tag => {
    tag.field = 'value';
    tag.value = [tag.name, (openopps.auth.loginGov.enabled ? (tag.governmentUri || tag.username): tag.username)].join(' - ');
    
    return tag;
  });
};

module.exports.keywordAutocomplete = async function (term) {
  var searchString = term ? '%' + term.toLowerCase() + '%' : '';
  return Promise.all([
    db.query(dao.query.departmentAutocomplete, [searchString, searchString]),
    db.query(dao.query.agencyAutocomplete, [searchString, searchString]),
    db.query(dao.query.tagAutocomplete, ['career', searchString]),
    db.query(dao.query.tagAutocomplete, ['skill', searchString]),
    db.query(dao.query.tagAutocomplete, ['series', searchString]),
  ]);
};

module.exports.languageByValue = async function (value) {
  var result = await dao.Language.query(
    dao.query.language, value ? '%' + value.toLowerCase() + '%' || value.toLowerCase() + '%' || '%' + value.toLowerCase() : null);
  return result.map(tag=>{
    tag.field = 'name';
    tag.id = tag.languageId;
    tag.type = 'language';
    tag.name = tag.value;
    tag.value = tag.value;
    
    return tag;
  });
};

module.exports.countryByValue = async function (value) {
  var result = await dao.Country.query(
    dao.query.country, value ? '%' + value.toLowerCase() + '%' || value.toLowerCase() + '%' || '%' + value.toLowerCase() : null);
  return result.map(tag=>{
    tag.id=tag.countryId;
    tag.field='value';
    tag.value= tag.value;

    return tag;
  });
};

module.exports.stateByValue = async function (parentCode, value) {
  var result = await dao.CountrySubdivision.query(
    dao.query.state, value ? '%' + value.toLowerCase() + '%' || value.toLowerCase() + '%' || '%' + value.toLowerCase() : null, parentCode);
  return result.map(tag=>{
    tag.id = tag.countrySubdivisionId;
    tag.field ='value';
    tag.value = tag.value;

    return tag;
  });
};

module.exports.getCountrySubdivisions = async function (countryCode) {
  return _.sortBy((await dao.CountrySubdivision.find('parent_code = ?', [countryCode])).map(item => {
    item.id = item.countrySubdivisionId;
    return item;
  }), [ 'value' ]);
};

module.exports.agency = async function (name) {
  var abbr =  name ? name.toLowerCase() + '%' : '';
  name = name ? '%' + name.toLowerCase() + '%' : '';
  var result = await dao.Agency.query(dao.query.agency, [name, abbr]);
  return result.map(tag => {
    tag.id = tag.agencyId;
    tag.field = 'name';
    tag.value = tag.name;
    tag.name = tag.name;
    tag.type = 'agency';

    return tag;
  });
};

