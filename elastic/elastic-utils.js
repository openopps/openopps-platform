const _ = require('lodash');

var utils = {};

function initializeRequest (index, type) {
  return {
    index: index,
    type: type,
    from: 0,
    size: 10,
    body: {
      query : {
        bool : {
          filter : {
            bool: {
              must: [] ,
              must_not: [],
            },
          },
          should : [],
          minimum_should_match : 0,
        },
      },
    },
  };
}

function addTerms (request, filter, field, defaultFilter) {
  var filter_must = request.body.query.bool.filter.bool.must;
  filter = filter || defaultFilter;
  if((filter && filter !== '_all')){
    filter_must.push({terms: { [field] : asArray(filter) }});
  }
}

function asArray (value) {
  return Array.isArray(value) ? value: [value];
}

function addLocations (request, location) {
  var should_match = request.body.query.bool.should;
  should_match.push({ multi_match: { fields: ['location.cityName', 'location.countrySubdivision', 'location.country'], query: location}});
}

utils.convertQueryStringToUserSearchRequest = function (ctx) {
  var query = ctx.query;
  var page = query.page || 1;
  var resultsperpage =  query.resultsperpage || 10;
  var from = (page - 1) * resultsperpage;
  
  var request = initializeRequest('user', 'user');
  request.from = from || request.from;
  request.size = resultsperpage || request.size;

  var keywords = [];
  if (query.term) {
    keywords = Array.isArray(query.term) ? query.term : [query.term];
  }

  if (keywords.length > 0) {
    var keyword = '';
    keyword = keywords.join(' ');
    request.body.query.bool.must = {
      simple_query_string: {
        query : keyword,
      },
    };
  }

  if (query.location) {
    request.body.query.bool.minimum_should_match = 1;
    if (_.isArray(query.location)) {
      _.each(query.location, function (location) {
        addLocations(request, location);
      });
    } else {
      addLocations(request, query.location);
    }
  }
  
  addTerms(request, query.skills, 'skills.name');
  addTerms(request, query.career, 'career.name');
  addTerms(request, query.agency, 'agency.name');

  return request;
};

module.exports = utils;