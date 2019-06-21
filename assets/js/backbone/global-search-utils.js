var _ = require('underscore');

/**
 * Converts bound context filters to URL parameters
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
 */
global.parseURLToFilters = function () {
  _.each(_.omit(this.queryParams, 'search'), function (value, key) {
    if (_.isArray(value)) {
      values = value;
    } else {
      values = value.split(';');
    }
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
 */
global.addLocation = function (location) {
  if(location == 'USA') {
    location = 'United States';
  }
  if (this.filters.location && _.isArray(this.filters.location)) {
    this.filters.location.push(location.trim());
  } else {
    this.filters.location = [location.trim()];
  }
  this.filters.page = 1;
};