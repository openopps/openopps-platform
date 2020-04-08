const _ = require('lodash');
const db = require('../db/client');
const moment = require('moment');
const util = require('util');
const Agency = require('../api/model/Agency');

var dao = {}; 

dao.tasksToIndex = async function (){
  var query = util.format(tasksToIndexQuery,'order by t.id');
  try {
    var result = await db.query(query);
    return _.map(result.rows, toElasticOpportunity);
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.usersToIndex = async function () {
  var query = util.format(usersToIndexQuery,'where u.disabled = false and u.name is not null and trim(u.name) <> \'\' and u.hiring_path = \'fed\' order by u.id desc');
  try {
    var result = await db.query(query);
    return _.map(result.rows, (row) => { 
      return _.pickBy(row.user, _.identity);
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.userToIndex = async function (id) {
  var query = util.format(usersToIndexQuery, 'where u.id = $1');
  try {
    var result = await db.query(query, [id]);
    return _.map(result.rows, (row) => { 
      return _.pickBy(row.user, _.identity);
    });
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.taskToIndex = async function (id){
  var query = util.format(tasksToIndexQuery,'where t.id = $1');
  try {
    var result = await db.query(query, [id]);
    return _.map(result.rows, toElasticOpportunity);
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.cycleTasksToIndex = async function (cycleId) {
  var query = util.format(tasksToIndexQuery,'where cy.cycle_id = $1');
  try {
    var result = await db.query(query, [cycleId]);
    return _.map(result.rows, toElasticOpportunity);
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.agencyTasksToIndex = async function (agencyId) {
  var query = util.format(tasksToIndexQuery,'where t.agency_id = $1');
  try {
    var result = await db.query(query, [agencyId]);
    return _.map(result.rows, toElasticOpportunity);
  } catch (error) {
    console.error(error);
    return null;
  }
};

dao.communityTasksToIndex = async function (communityId) {
  var query = util.format(tasksToIndexQuery, 'where t.community_id = $1');
  try {
    var result = await db.query(query, [communityId]);
    return _.map(result.rows, toElasticOpportunity);
  } catch (error) {
    console.error(error);
    return null;
  }
};

function toElasticOpportunity (value, index, list) {
  var doc = value.task;
  var locationType = 'Virtual';
  if (Array.isArray(doc.location) && doc.location.length > 0) {
    locationType = 'In Person';
  } else if (doc.country != null && doc.country != '') {
    locationType = 'In Person';
  }
  return {
    'id': doc.id,
    'title': doc.title,
    'description': doc.description,
    'state': doc.state,
    'details': doc.details,
    'outcome': doc.outcome,
    'about': doc.about,
    'restrictedToAgency': doc.restricted_to || 'null',
    'owner': { name: doc.name, id: doc.ownerId, photoId: doc.photoId },
    'publishedAt': doc.publishedAt,
    'postingAgency': doc.agencyName,
    'postingLocation': { cityName: doc.city_name, countrySubdivision: doc.country_subdivision, country: doc.country, cityCountrySubdivision: doc.city_country_subdivision, cityCountry: doc.city_country },
    'acceptingApplicants': doc.acceptingApplicants,
    'taskPeople': (_.first(doc['task-people']) || { name: null }).name,
    'timeRequired': (_.first(doc['task-time-required']) || { name: null }).name,
    'timeEstimate': (_.first(doc['task-time-estimate']) || { name: null }).name,
    'taskLength': (_.first(doc['task-length']) || { name: null }).name, 
    'skills': doc.skills,
    'locationType': locationType,
    'locations': doc.location,
    'series': _.map(doc.series, (item) => { return  {id: item.id || 0, code: item.name.substring(0,4), name: item.name.replace(/.*\((.*)\).*/,'$1') };}),
    'careers': doc.career,
    'keywords': _.map(doc.keywords, (item) => item.name),
    'isInternship': doc.target_audience == 2 ? 1 : 0,
    'languages': doc.languages,
    'community': { id: doc.community_id,name: doc.community_name, shortName: doc.community_short_name, communityLogo: doc.community_logo, displayAgencyLogo:doc.display_agency_logo, displayCommunityName:doc.display_community_name, imageId: doc.communityImageId},
    'cycle': { id: doc.cycle_id, name: doc.cycle_name, applyStartDate: doc.apply_start_date, applyEndDate: doc.apply_end_date },
    'bureau': { id: doc.bureau_id, name: doc.bureau_name },
    'office': { id: doc.office_id, name: doc.office_name },
    'grade': doc.grade,
    'payPlan': { id: doc.pay_plan_id, name: doc.code },
    'detailSelection': doc.detail_selection,
    'agencyId' : doc.agency_id,
    'agencyName': doc.agencyName,
    'agency': { id: doc.agency_id, name: doc.agencyName, imageId: doc.agencyImageId },
  };
}
    
const tasksToIndexQuery = `select row_to_json(row) as task
from (
  select
    t.id,
    t.title,
    t.description,
    case when t.state = 'in progress' and t.accepting_applicants = true then 'open' else t.state end as "state",
    t.details,
    t.outcome,
    t.about,
    t.grade,
    t.restricted_to,
    t.agency_id,
    a.name as "agencyName",
    a.image_id as "agencyImageId",
    t.restrict ->> 'projectNetwork' as "isRestricted",
    t."publishedAt",
    u.name,
    u.id as "ownerId",
    u."photoId",
    c.target_audience,
    c.community_id,
    c.community_name,
    c.community_short_name,
    c.community_logo,
    c.display_agency_logo,
    c.image_id as "communityImageId",
    t.city_name,
    cs.value as "country_subdivision",
    ct.value as "country",
    t.city_name || ', ' || cs.value as city_country_subdivision,
    t.city_name || ', ' || ct.value as city_country,
	  cy.cycle_id,
	  cy.name as "cycle_name",
	  cy.apply_start_date,
    cy.apply_end_date,
    b.bureau_id,
    b.name as bureau_name,
    p.pay_plan_id,
    p.code,
    t.detail_selection,
    o.office_id,
    o.name as office_name,
    t.accepting_applicants as "acceptingApplicants",
    (
      select  
        array_to_json(array_agg(row_to_json(s)))
      from (
        select
          skilltags.id,
          skilltags.name
        from tagentity_tasks__task_tags tt
          left join tagentity skilltags on skilltags.id = tt.tagentity_tasks
        where
          skilltags.type = 'task-people' and
          tt."task_tags" = t.id
      ) s
    ) as "task-people",
    (
      select
        array_to_json(array_agg(row_to_json(s)))
      from (
        select
          taskpeopletags.id,
          taskpeopletags.name
        from tagentity_tasks__task_tags tt
          left join tagentity taskpeopletags on taskpeopletags.id = tt.tagentity_tasks
        where
          taskpeopletags.type = 'skill' and
          tt."task_tags" = t.id
      ) s
    ) as skills,
    (
      select
        array_to_json(array_agg(row_to_json(s)))
      from (
        select
          tasklengthtags.id,
          tasklengthtags.name
        from tagentity_tasks__task_tags tt
          left join tagentity tasklengthtags on tasklengthtags.id = tt.tagentity_tasks
        where
          tasklengthtags.type = 'task-length' and
          tt."task_tags" = t.id
      ) s
    ) as "task-length",
    (
      select
        array_to_json(array_agg(row_to_json(l)))
      from (
        select
          languagetags.id,
          languagetags.name
        from tagentity_tasks__task_tags tt
          left join tagentity languagetags on languagetags.id = tt.tagentity_tasks
        where
          languagetags.type = 'location' and
          tt."task_tags" = t.id
      ) l
    ) as "location",
    (
      select
        array_to_json(array_agg(row_to_json(l)))
      from (
        select
          locationtags.id,
          locationtags.name
        from tagentity_tasks__task_tags tt
          left join tagentity locationtags on locationtags.id = tt.tagentity_tasks
        where
          locationtags.type = 'task-time-estimate' and
          tt."task_tags" = t.id
      ) l
    ) as "task-time-estimate",
    (
      select
        array_to_json(array_agg(row_to_json(l)))
      from (
        select
          ltags.id,
          ltags.name
        from tagentity_tasks__task_tags tt
          left join tagentity ltags on ltags.id = tt.tagentity_tasks
        where
          ltags.type = 'series' and
           tt."task_tags" = t.id
      ) l
    ) as series,
    (
      select
        array_to_json(array_agg(row_to_json(l)))
      from (
        select
          timetags.id,
          timetags.name
        from tagentity_tasks__task_tags tt
          left join tagentity timetags on timetags.id = tt.tagentity_tasks
        where
          timetags.type = 'task-time-required' and
          tt."task_tags" = t.id
      ) l
    ) as "task-time-required",
    (
      select
        array_to_json(array_agg(row_to_json(l)))
      from (
        select
          careertags.id,
          careertags.name
        from tagentity_tasks__task_tags tt
          left join tagentity careertags on careertags.id = tt.tagentity_tasks
        where
          careertags.type = 'career' and
          tt."task_tags" = t.id
      ) l
    ) as "career",
    (
      select array_to_json(array_agg(row_to_json(s)))
      from (
        select
          skilltags.id,
          skilltags.name
        from tagentity_tasks__task_tags tt
          left join tagentity skilltags on skilltags.id = tt.tagentity_tasks
        where
          skilltags.type = 'task-skills-required'
          and tt."task_tags" = t.id
      ) s
    ) as "task-skills-required",
    (
      select 
        array_to_json(array_agg(row_to_json(k)))
      from (
        select 
          keytags.id,
          keytags.name
        from tagentity_tasks__task_tags tt
          left join tagentity keytags on keytags.id = tt.tagentity_tasks
        where
         keytags.type = 'keywords' and
         tt."task_tags" = t.id
      ) k
    ) as keywords,
    (
      select
        array_to_json(array_agg(row_to_json(k)))
      from (
        select
          topictags.id,
          topictags.name
        from tagentity_tasks__task_tags tt
          left join tagentity topictags on topictags.id = tt.tagentity_tasks
        where
          topictags.type = 'topic' and
          tt."task_tags" = t.id
      ) k
    ) as topic,
    (
      select
       array_to_json(array_agg(row_to_json(l)))
      from (
        select
          language.language_id as "id",
          language.value as "name"
        from language
          inner join language_skill ls on ls.language_id = language.language_id
        where t.id = ls.task_id
      ) l
    ) as languages
  from task t
    inner join midas_user u on t."userId" = u.id  
  left join agency a on t.agency_id = a.agency_id
  left join community c on c.community_id = t.community_id
  left join country_subdivision cs on cs.country_subdivision_id = t.country_subdivision_id
  left join country ct on ct.country_id = t.country_id
  left join cycle cy on cy.cycle_id = t.cycle_id
  left join bureau b on b.bureau_id = t.bureau_id
  left join office o on o.office_id = t.office_id
  left join pay_plan p on p.pay_plan_id= t.pay_level_id
  %s
) row`;

const usersToIndexQuery = `select row_to_json(row) as user
from
(
select
  u.id,
  trim(u.name) as name,
  trim(u.given_name) as "givenName",
  trim(u.middle_name) as "middleName",
  trim(u.last_name) as "lastName",
  trim(u.title) as title,
  u.bio,
  u."photoId",
  (
    select
      row_to_json(l)
    from (
      select
        midas_user.city_name as "cityName",
        country_subdivision.value as "countrySubdivision",
        country.value as country,
        midas_user.city_name || ', ' || country_subdivision.value as "cityCountrySubdivision",
        midas_user.city_name || ', ' || country.value as "cityCountry"
      from
        midas_user
      left join country on country.country_id = u.country_id
      left join country_subdivision on country_subdivision.country_subdivision_id = u.country_subdivision_id
      where midas_user.id = u.id
    ) l
  ) as location,
  (
    select
      row_to_json(a)
    from
    (
      select
        agency_id,
        "name"
      from
        agency
      where
        agency.agency_id = u.agency_id
    ) a
  ) as agency,
  (
    select
      row_to_json(c)
    from
    (
      select
        careertags.id,
        careertags.name
      from
        tagentity_users__user_tags ut
      left join tagentity careertags on
        careertags.id = ut.tagentity_users
      where
        careertags.type = 'career'
        and ut."user_tags" = u.id
    ) c
  ) as career,
  (
    select
      array_to_json(array_agg(row_to_json(s)))
    from
    (
      select
        userskilltags.id,
        userskilltags.name
      from
        tagentity_users__user_tags ut
      left join tagentity userskilltags on
        userskilltags.id = ut.tagentity_users
      where
        userskilltags.type = 'skill'
        and ut."user_tags" = u.id
    ) s
  ) as skills
from
  midas_user u
  %s
) row`;


module.exports = dao;
