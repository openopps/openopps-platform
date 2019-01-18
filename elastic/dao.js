const _ = require('lodash');
const db = require('../db/client');
const moment = require('moment');
const util = require('util');

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

function toElasticOpportunity (value, index, list) {
  var doc = value.task;
  return {
    'id': doc.id,
    'title': doc.title,
    'description': doc.description,
    'state': doc.state,
    'details': doc.details,
    'outcome': doc.outcome,
    'about': doc.about,
    'restrictedToAgency': doc.isRestricted === 'true' ? doc.agencyName : 'null',
    'owner': { name: doc.name, id: doc.ownerId, photoId: doc.photoId },
    'publishedAt': doc.publishedAt,
    'postingAgency': doc.agencyName,
    'acceptingApplicants': doc.acceptingApplicants,
    'taskPeople': (_.first(doc['task-people']) || { name: null }).name,
    'timeRequired': (_.first(doc['task-time-required']) || { name: null }).name,
    'timeEstimate': (_.first(doc['task-time-estimate']) || { name: null }).name,
    'taskLength': (_.first(doc['task-length']) || { name: null }).name, 
    'skills': doc.skills,
    'locationType': Array.isArray(doc.location) && doc.location.length > 0 ? 'In Person' : 'Virtual',
    'locations': doc.location,
    'series': _.map(doc.series, (item) => { return  {id: item.id || 0, code: item.name.substring(0,4), name: item.name.replace(/.*\((.*)\).*/,'$1') };}),
    'careers': doc.career,
    'keywords': _.map(doc.keywords, (item) => item.name),
    'targetAudience': doc.target_audience,
    'languages': doc.languages,
    'communityId': { id: doc.community_id, name: doc.community_name }
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
    a.name as "agencyName",
    t.restrict ->> 'projectNetwork' as "isRestricted",
    t."publishedAt",
    u.name,
    u.id as "ownerId",
    u."photoId",
    c.target_audience,
    c.community_id,
    c.community_name,
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
  %s
) row`;


module.exports = dao;
