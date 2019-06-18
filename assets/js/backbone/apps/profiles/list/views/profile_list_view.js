var _ = require('underscore');
var Backbone = require('backbone');
var ProfileListTemplate = require('../templates/profile_list_template.html');
var ProfileListTable = require('../templates/profile_list_table.html');
var Pagination = require('../../../../components/pagination.html');

var PeopleListView = Backbone.View.extend({
  events: {
    'keyup #nav-keyword'    : 'search',
    'change #sort-results'  : 'sortPeople',
  },

  initialize: function (options) {
    this.el = options.el;
    this.collection = options.collection;
  },

  render: function () {
    $('#search-results-loading').show();
    var template = _.template(ProfileListTemplate)({});
    this.$el.html(template);
    this.$el.localize();
    this.fetchData();
    var pageSize = 10;
    var page = 1; //TODO: change to not hardcoded
    var searchResults = {
      hits: [],
      totalHits: 25,
    }; //TODO: change to not hardcoded
    this.renderPage(searchResults, page, pageSize);
    this.renderPagination({
      page: page,
      numberOfPages: Math.ceil(searchResults.totalHits/pageSize),
      pages: [],
    });
  },

  renderNoResults: function () {
    var settings = {
      ui: UIConfig,
    };
    compiledTemplate = _.template(NoListItem)(settings);
    $('#people-list').append(compiledTemplate);
    $('#people-page').hide();      
    $('#people-count').hide();
  },

  renderPage: function (searchResults, page, pageSize) {
    var self = this;
    var start = (page - 1) * pageSize;
    var stop = page * pageSize;
    
    _.each(searchResults.hits, function (value, key) {
      $('#people-list').append(self.renderItem(value.result));
    });
    this.renderResultsCount(start, stop, pageSize, searchResults.totalHits, searchResults.hits.length);
  },
    
  renderResultsCount: function (start, stop, pageSize, numResults, pagedNumResults) {
    if (numResults <= pageSize) {
      $('#people-count').text('Viewing ' +  (start + 1) + ' - ' + numResults + ' of ' + numResults + ' people');
    } else if (pagedNumResults < pageSize) {
      $('#people-count').text('Viewing ' +  (start + 1) + ' - ' + (start + pagedNumResults) + ' of ' + numResults + ' people');
    } else {
      $('#people-count').text('Viewing ' +  (start + 1) + ' - ' + stop + ' of ' + numResults + ' people');
    }
    $('#people-count').show();
  },

  renderPagination: function (data) {
    if(data.numberOfPages < 8) {
      for (var j = 1; j <= data.numberOfPages; j++)
        data.pages.push(j);
    } else if (data.page < 5) {
      data.pages = [1, 2, 3, 4, 5, 0, data.numberOfPages];
    } else if (data.page >= data.numberOfPages - 3) {
      data.pages = [1, 0];
      for (var i = data.numberOfPages - 4; i <= data.numberOfPages; i++)
        data.pages.push(i);
    } else {
      data.pages = [1, 0, data.page - 1, data.page, data.page + 1, 0, data.numberOfPages];
    }
    var pagination = _.template(Pagination)(data);
    $('#people-page').html(pagination);
    $('#people-page').show();
  },

  filter: function () {
    this.addFiltersToURL();
    $.ajax({
      url: '/api/user/search' + location.search,
      type: 'GET',
      async: true,
      success: function (data) {
        this.renderList(data, this.filters.page || 1);
      }.bind(this),
    });
  },

  renderList: function (searchResults, page) {
    $('#search-results-loading').hide();
    $('#people-list').html('');
    this.peopleFilteredCount = searchResults.totalHits;

    if (searchResults.totalHits === 0) {
      this.renderNoResults();
    } else {
      var pageSize = 10;
      this.renderPage(searchResults, page, pageSize);
      this.renderPagination({
        page: page,
        numberOfPages: Math.ceil(searchResults.totalHits/pageSize),
        pages: [],
      });
    }
  },

  renderNoResults: function () {
    var settings = {
      ui: UIConfig,
    };
    compiledTemplate = _.template(NoListItem)(settings);
    $('#people-list').append(compiledTemplate);
    $('#people-page').hide();
    $('#results-count').hide();
  },

  fetchData: function () {
    var self = this;
    self.collection.fetch({
      success: function (collection) {
        var peopleToRender = collection.chain().pluck('attributes').value();
        var template = _.template(ProfileListTable)({ people: peopleToRender });
        self.$('#people-list').html(template);
        $('#search-results-loading').hide();
      },
    });
  },

  search: function (event) {
    var target = this.$(event.currentTarget);
    var term = target.val();
    items = this.collection.chain()
      .pluck('attributes')
      .filter( _.bind( filterPeople, this, term ) )
      .value();
    var template = _.template(ProfileListTable)({ people: items });
    self.$('#people-list').html(template);
  },

  sortPeople: function (e) {
    var target = $(e.currentTarget)[0];
    // var data = this.collection.models[target.id == 'sort-results'];
    var data = this.collection.chain().pluck('attributes').value();
    var sortedData = [];
    if(target.value == 'name'){
      sortedData = _.sortBy(data, function (person){
        return person.name;
      });
    }
    if(target.value == 'title'){
      sortedData = _.sortBy(data, function (person){
        return person.title.toLowerCase();
      });
    }
    if(target.value == 'agency'){
      sortedData = _.sortBy(data, function (person){
        return person.agency.toLowerCase();
      });
    }
    if(target.value == 'location'){
      sortedData = _.sortBy(data, function (person){
        return person.location.toLowerCase();
      });
    }
    this.peopleToRender.options.sort = target.value;
    this.peopleToRender.options.data = sortedData;
    this.peopleToRender.render();
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

function filterPeople ( term, person ) {
  var name = person.name ? person.name.toLowerCase() : '';
  var title = person.title ? person.title.toLowerCase() : '';
  var location = person.location ? person.location.name.toLowerCase() : '';
  var agency = person.agency ? person.agency.name.toLowerCase() : '';
  var career = person.career ? person.career.name.toLowerCase() : '';
  var abbreviation = person.agency && person.agency.abbr ? person.agency.abbr.toLowerCase() : '';
  var skill = person.skill ? person.skill.name.toLowerCase() : '';
  return (name.indexOf(term.toLowerCase()) > -1) ||
    (title.indexOf(term.toLowerCase()) > -1) ||
    (location.indexOf(term.toLowerCase()) > -1) ||
    (agency.indexOf(term.toLowerCase()) > -1) ||
    (career.indexOf(term.toLowerCase()) > -1) ||
    (abbreviation.indexOf(term.toLowerCase()) > -1) ||
    (skill.indexOf(term.toLowerCase()) > -1);
}

module.exports = PeopleListView;
