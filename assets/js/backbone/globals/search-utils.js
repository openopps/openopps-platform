var _ = require('underscore');
var $ = require('jquery');

/**
 * Converts bound context filters to URL parameters
 * 
 * Example: addFiltersToURL.bind(this)()
 */
global.addFiltersToURL = function () {
  var urlObject = {};

  for (var key in this.filters) {
    if (this.filters[key] != null && this.filters[key] != '') {
      if (_.isArray(this.filters[key])) {
        urlObject[key] = [];
        $.each(this.filters[key], function (k, skey) {
          if (_.isObject(skey)) {
            urlObject[key].push(formatObjectForURL(skey));
          } else {
            urlObject[key].push(skey);
          }
        });
      } else if (_.isObject(this.filters[key])) {
        urlObject[key] = formatObjectForURL(this.filters[key]);
      } else {
        urlObject[key] = this.filters[key];
      }
    }
  }

  if (this.firstFilter) {
    history.replaceState({}, document.title, window.location.href.split('?')[0] + '?' + $.param(urlObject, true));
    this.firstFilter = false;
  } else {
    history.pushState({}, document.title, window.location.href.split('?')[0] + '?' + $.param(urlObject, true));
  }
};

/**
 * Converts URL parameters to bound context filters
 * 
 * Example: parseURLToFilters.bind(this)()
 */
global.parseURLToFilters = function () {
  _.each(_.omit(this.queryParams, 'search'), function (value, key) {
    var values = _.isArray(value) ? value : value.split(';');
    if (key == 'term') {
      this.filters.term = value;
    } else if (key == 'page') {
      if (!isNaN(value)) {
        this.filters.page = parseInt(value);
      }
    } else {    
      if (key == 'program' || key == 'bureau' || key == 'office')
      {
        this.filters[key] = { type: key, name: this.filterLookup[key][value], id: value };
      } else { 
        this.filters[key] = _.map(values, function (value) {
          if (key == 'location') {
            return value;
          }
          return { type: key, name: value };
        });
      }
    }
  }.bind(this));
};

/**
 * Adds location value to bound context location filters
 * 
 * Example: addLocation.bind(this)(location)
 */
global.addLocation = function (location) {
  if(location == 'USA') {
    location = 'United States';
  }
  if (this.filters.location && _.isArray(this.filters.location)) {
    this.filters.location.push(location.trim());
    this.filters.location = _.unique(this.filters.location);
  } else {
    this.filters.location = [location.trim()];
  }
  this.filters.page = 1;
};

/**
 * Initializes a jQuery autocomplete field for keyword search
 * and updates the bound context filters.
 * 
 * Example: initializeKeywordSearch.bind(this)('#keyword-search')
 * 
 * @param {string} element the id of the autocomplete field
 */
global.initializeKeywordSearch = function (element) {
  $(element).keywordAC({
    source: function (request, response) {
      $.ajax({
        url: '/api/ac/keyword',
        dataType: 'json',
        data: { term: request.term.trim() },
        success: function (data) {
          response(parseKeywordAutocompleteResults(request.term, data, this.filters));
        }.bind(this),
      });
    }.bind(this),
    minLength: 2,
    select: function (event, ui) {
      event.preventDefault();
      if (ui.item.type == 'career fields') {
        this.filters['career'] = _.union(this.filters['career'], [ui.item.name]);
      } else if (ui.item.type == 'agencies') {
        this.filters['agency'] = _.union(this.filters['agency'], [ui.item.name]);
      } else {
        this.filters[ui.item.type] = _.union(this.filters[ui.item.type], [ui.item.name]);
      }
      this.filters.page = 1;
      this.filter();
      $(element).val('');
    }.bind(this),
  });
};

/**
 * Initializes a jQuery autocomplete field for location search
 * and updates the bound context filters.
 * 
 * Example: initializeLocationSearch.bind(this)('#location-search')
 * 
 * @param {string} element the id of the autocomplete field
 */
global.initializeLocationSearch = function (element) {
  $(element).locationAC({
    source: function (request, response) {
      $.ajax({
        url: usajobsDataURL + '/api/autocomplete/location',
        dataType: 'json',
        data: {
          term: request.term.trim(),
        },
        crossDomain: true,
        success: function (data) {
          var results = [];

          for (var key in data) {
            if (key != 'continents' && key != 'counties') {
              for (var i = 0; i < data[key].length; i++) {
                var label = data[key][i].Name;
                var code = data[key][i].Code;
                var parentName = '';

                var autocompleteItem = {
                  value: label,
                  label: splitTermHighlighter(label, request.term),
                  type: key,
                  actualValue: code,
                  parentName: parentName,
                };

                results.push(autocompleteItem);
              }
            }
          }

          response(results);
          $('#search-results-loading').hide();
        }.bind(this),
      });
    }.bind(this),
    minLength: 2,
    select: function (event, ui) {
      event.preventDefault();
      addLocation.bind(this)(ui.item.actualValue);

      $('#nav-location').val('');
      this.filter();
    }.bind(this),
  });
},

/**
 * Highlights (bold) matching part of string S from term T
 * 
 * @param {string} s string to match on
 * @param {string} t term or substring to highlight
 * 
 */
global.splitTermHighlighter = function (s, t) {
  var splitString = t.split(' ').sort(function (a, b) { return b.length - a.length; }),
      matcherString = '';

  for (var i = 0; i < splitString.length; i++) {
    if (splitString[i] !== '') {
      matcherString = matcherString + '(' + $.ui.autocomplete.escapeRegex(splitString[i]) + ')|';
    }
  }

  var matcher = new RegExp(matcherString, 'ig');
  s = s.replace(matcher, '<strong>$&</strong>');

  return s;
};

function formatObjectForURL (value) {
  return value.name;
}

function parseKeywordAutocompleteResults (term, results, filters) {
  var pattern = new RegExp('(' + term + ')', 'ig');
  var data = Object.keys(results).map(function (key) { 
    return results[key].map(function (item) {
      var label = item.name;
      if (key == 'agencies' && item.abbr) {
        label += ' (' + item.abbr + ')';
      }
      return _.extend(item, {
        type: key.replace(/_/g, ' '),
        label: label.replace(pattern, '<strong>$1</strong>'),
        value: item.name,
      });
    });
  }).reduce(function (a, b) { 
    return a.concat(b);
  }, []);
  return _.reject(data, function (item) {
    return _.findWhere(filters.keywords, _.pick(item, 'type', 'name', 'id'));
  }.bind(this));
}