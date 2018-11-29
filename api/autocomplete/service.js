const log = require('log')('app:autocomplete:service');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');

async function tagByType (type, name) {
  var query = dao.query.tagByType;
  query += name ? ' and lower(name) like ?' : '';
  var result = await dao.TagEntity.query(query, type, name ? '%' + name.toLowerCase() + '%' : '');
  return _.sortBy(result, 'data.sort', 'name').map(tag => {
    tag.field = 'name';
    tag.value = tag.name;
    return tag;
  });
}

async function userByName (name) {
  var result = await dao.User.query(
    dao.query.userByName, name ? '%' + name.toLowerCase() + '%' || name.toLowerCase() + '%' || '%' + name.toLowerCase() : null
  );
  return result.map(tag => {
    tag.field = 'value';
    tag.value = [tag.name, openopps.auth.loginGov.enabled ? (tag.governmentUri || tag.username): tag.username].join(' - ');
    return tag;
  });
}

async function languageByValue (value) {
  var result = await dao.Language.query(
    dao.query.language, value ? '%' + value.toLowerCase() + '%' || value.toLowerCase() + '%' || '%' + value.toLowerCase() : null);
  return result.map(tag=>{
    tag.id=tag.languageId;
    tag.field='value';
    tag.value= tag.value;
    return tag;
  });
}

async function agency (name) {
  var abbr =  name ? name.toLowerCase() + '%' : '';
  name = name ? '%' + name.toLowerCase() + '%' : '';
  var result = await dao.Agency.query(dao.query.agency, [name, abbr]);
  return result.map(tag => {
    tag.id = tag.agencyId;
    tag.field = 'name';
    tag.value = tag.name;
    return tag;
  });
}

module.exports = {
  tagByType: tagByType,
  userByName: userByName,
  agency: agency,
  language:languageByValue,
};
