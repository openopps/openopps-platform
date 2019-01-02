const elasticClient = require('./index');
const dao = require('./dao');
const _ = require('lodash');

var service = {};

service.reindexOpportunities = async function () {
  var records = await dao.tasksToIndex();
  var bulk_request = [];
  
  for(i=0; i<records.length; i++){
    bulk_request.push({index: { _index: 'task', _type: 'task', _id: records[i].id }});
    bulk_request.push(records[i]);
  }
  
  await elasticClient.bulk({ body: bulk_request });
  return records;
};
  
service.indexOpportunity =  async function (taskId) {
  if (!(await elasticClient.IsAlive()))
  {
    return null;
  }
  var records = await dao.taskToIndex(taskId);
  
  var bulk_request = [];
  
  for(i=0; i<records.length; i++){
    bulk_request.push({index: { _index: 'task', _type: 'task', _id: records[i].id }});
    bulk_request.push(records[i]);
  }
  
  await elasticClient.bulk({ body: bulk_request });
  return records;
};

service.searchOpportunities = async function (request) {
  var searchResults = null;
  if(request){
    searchResults = await elasticClient.search(request);
  }
  else{
    searchResults = await elasticClient.search({ index: 'task' });
  }
  var result = {};
  result.totalHits = searchResults.hits.total;
  result.hits = _.map(searchResults.hits.hits, convertSearchResultsToResultModel);
  return result;
};
  
service.convertQueryStringToOpportunitiesSearchRequest = function (query, index){
  var page = query.page || 1;
  var resultsperpage =  query.resultsperpage || 10;
  var from = (page - 1) * resultsperpage;
  var request = {
    index: index || 'task',
    type: 'task',
    from: from > 0 ? from : 0,
    size: resultsperpage > 0 ? resultsperpage : 10,
    body: {
      query : {
        bool : {
          filter : {
            bool: {
              must: [] ,
              must_not: [],
            },
          },
        },
      },
    },
    addTerms (filter, field, defaultFilter) { 
      filter = filter || defaultFilter;
      if(filter && filter !== '_all'){
        filter_must.push({terms: { [field] : asArray(filter) }});
      }
    },
  };
  var filter_must = request.body.query.bool.filter.bool.must;
  var filter_must_not = request.body.query.bool.filter.bool.must_not;
  
  var formatParamTypes = ["skill", "career", "series", "location"];

  for(i=0; i<formatParamTypes.length; i++){
    var formatParam = query[formatParamTypes[i]];
    if (formatParam && _.isArray(formatParam)) {
      var newList = [];
      _.each(formatParam, function(item) {
        if (formatParamTypes[i] === "location" && (item === "virtual" || item === "in person")) {
          if (!query.locationType) {
            query.locationType = [];
          }
          query.locationType.push(item);
        } else if (formatParamTypes[i] === "series") {
          newList.push(item.split("(")[0].trim());
        } else {
          newList.push(item.split(":")[0].trim());
        }
      });
      if (newList.length === 0 && formatParamTypes[i] === "location") {
        delete query.location;
      } else {
        query[formatParamTypes[i]] = newList;
      }
    } else if (formatParam) {
      if (formatParamTypes[i] === "location" && (formatParam === "virtual" || formatParam === "in person")) {
        query.locationType = formatParam;
        delete query.location;
      } else if (formatParamTypes[i] === "series") {
        query[formatParamTypes[i]] = formatParam.split("(")[0].trim();
      } else {
        query[formatParamTypes[i]] = formatParam.split(":")[0].trim();
      }
    }
  }

  request.addTerms(query.state, 'state' , 'open');
  request.addTerms(query.skill, 'skills.name' );
  request.addTerms(query.career, 'careers.name' );
  request.addTerms(query.series, 'series.code' );
  request.addTerms(query.time, 'timeRequired' );
  request.addTerms(query.location, 'locations.name' );
  request.addTerms(query.locationType, 'locationType');
  
  if(query.term){
    var keyword = '';
    keyword = Array.isArray(query.term) ?query.term.join(' ') : query.term;
    request.query.bool.must = {
      simple_query_string: {
        query : keyword,
      },
    };
  }
  delete request.addTerms;
  return request;
};

function convertSearchResultsToResultModel (searchResult) {
  var model = {};
  var source = searchResult._source;
  model.score = searchResult._score;
  model.result = {
    id: source.id,
    title: source.title,
    status: source.state,
    description: source.description,
    details: source.details,
    outcome: source.outcome,
    about: source.about,
    restrictedToAgency: source.restrictedToAgency,
    requester: source.requester,
    updatedAt: source.updatedAt,
    postingAgency: source.postingAgency,
    acceptingApplicants: source.acceptingApplicants,
    taskPeople: source.taskPeople,
    timeRequired: source.timeRequired,
    timeEstimate: source.timeEstimate,
    taskLength: source.taskLength,
    skills: source.skills,
    locationType: source.locationType,
    locations: source.locations,
    series: source.series,
    careers: source.careers,
    keywords: source.keywords,
    owner: source.owner
  };
  removeEmpty(model);
  return model;
}

function asArray (value) {
  return Array.isArray(value) ? value: [value];
}

const removeEmpty = (obj) => {
  Object.keys(obj).forEach(key => {
    if (Array.isArray(obj[key]) && obj[key].length === 0) delete obj[key];
    if (obj[key] && typeof obj[key] === 'object') removeEmpty(obj[key]);
    else if (obj[key] == null) delete obj[key];
  });
 };
  
module.exports = service;