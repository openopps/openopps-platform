var _ = require('underscore');
var Backbone = require('backbone');
var UIConfig = require('../../../../config/ui.json');
var ProfileListTemplate = require('../templates/profile_list_template.html');
var ProfileTemplate = require('../templates/profile_template.html');
var ProfileListTable = require('../templates/profile_list_table.html');
var Pagination = require('../../../../components/pagination.html');
var NoResults = require('../templates/no_search_results.html');
var SearchPills = require('../templates/search_pills.html');

var PeopleListView = Backbone.View.extend({
  events: {
    'click #search-button'              : 'search',
    'change #sort-results'              : 'sortPeople',
    'click .usajobs-search-pills__item' : 'removeFilter',
    'click #search-pills-remove-all'    : 'removeAllFilters',
    'click a.page'                      : 'clickPage',
    'keypress #nav-keyword'             : 'searchOnEnter',
    'keypress #nav-location'            : 'searchOnEnter',

  },

  initialize: function (options) {
    this.el = options.el;
    this.queryParams = options.queryParams;
    this.filters = { term: this.queryParams.term, page: 1 };
    parseURLToFilters.bind(this)();
  },

  render: function () {
    $('#search-results-loading').show();
    var template = _.template(ProfileListTemplate)({
      term: this.filters.term ? this.filters.term : '',
      filters: this.filters,
    });
    this.$el.html(template);
    this.$el.localize();
    renderSystemAlerts('people');
    initializeKeywordSearch.bind(this)('#nav-keyword');
    initializeLocationSearch.bind(this)('#nav-location');
    this.filter();
    return this;
  },

  renderPage: function (searchResults, page, pageSize) {
    var start = (page - 1) * pageSize;
    var stop = page * pageSize;
    
    _.each(searchResults.hits, function (value, key) {
      $('#people-list').append(_.template(ProfileTemplate)({ person: value.result }));
    }.bind(this));
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

  clickPage: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.filters.page = $(e.currentTarget).data('page');
    this.filter();
    window.scrollTo(0, 0);
  },

  filter: function () {
    addFiltersToURL.bind(this)();
    this.renderPills();
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
      $('#profile-search-controls').show();
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
    var compiledTemplate = _.template(NoResults)(settings);
    $('#people-list').append(compiledTemplate);
    $('#people-page').hide();
    $('#profile-search-controls').hide();
  },

  renderPills: function () {
    var appliedFilterCount = 0;
    _.each(this.filters, function ( value, key ) {
      if (key != 'term' && key != 'page' && key != 'sort') {
        appliedFilterCount += (_.isArray(value) ? value.length : 1);
      }
    });
    var compiledTemplate = _.template(SearchPills)({
      filters: this.filters,
      appliedFilterCount: appliedFilterCount,
    });
    $('#usajobs-search-pills').html(compiledTemplate);
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

  search: function () {
    this.filters.term = this.$('#nav-keyword').val().trim(); 
    if (this.$('#nav-location').val().trim() != '') {
      addLocation.bind(this)($('#nav-location').val());
    }
    this.$('#nav-location').val('');
    this.filters.page = 1;
    this.filter();
  },

  searchOnEnter : function (event){
    if((event.keyCode==13 || event.keyCode==10) &&!event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey){
      this.search();
    }
  },

  removeFilter: function (event) {
    event.preventDefault();
    var element = $(event.target).closest('.usajobs-search-pills__item');
    var type = element.data('type');
    var value = element.data('value');
    if(_.isArray(this.filters[type])) {
      this.filters[type] = _.filter(this.filters[type], function (filter) {
        return !_.isEqual(filter, value);
      });
    } else if (_.isEqual(this.filters[type], value)) {
      this.filters[type] = [];
    }
    this.filters.page = 1;
    this.filter();
  },

  removeAllFilters: function (event) {
    event.preventDefault();
    this.filters = { page: 1 };
    this.filter();
  },

  sortPeople: function (e) {
    var target = $(e.currentTarget)[0];
    if (target.value == 'relevance') {
      this.filters.sort = '';
    } else {
      this.filters.sort = target.value;
    }
    this.filter.page = 1;
    this.filter();
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = PeopleListView;
