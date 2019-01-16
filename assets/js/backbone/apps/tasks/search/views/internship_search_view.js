var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TagFactory = require('../../../../components/tag_factory');
var InternshipListItem = require('../templates/internship_search_item.html');
var InternshipListTemplate = require('../templates/internship_search_template.html');
var NoListItem = require('../templates/no_search_results.html');
var Pagination = require('../../../../components/pagination.html');
var InternshipFilters = require('../templates/internship_filters.html');

var InternshipListView = Backbone.View.extend({
  events: {
    'click #search-button'                    : 'search',   
    'change #js-restrict-task-filter'         : 'agencyFilter',
    'click a.page'                            : 'clickPage',
    'click #search-tab-bar-filter'            : 'toggleFilter',
    'click .usajobs-search-filter-nav__back'  : 'toggleFilter',
    'click .usajobs-search-pills__item'       : 'removeFilter',
    'click #search-pills-remove-all'          : 'removeAllFilters',
    'change input[type=radio][name=internship-program]'  : 'changedInternsPrograms',
  },
    
  initialize: function (options) {
    this.el = options.el;
    this.tagFactory = new TagFactory();
    this.collection = options.collection;
    this.queryParams = options.queryParams;
    
    this.filters = { state: 'open', term: this.queryParams.search, page: 1 };
    this.firstFilter = true;
    this.parseURLToFilters();
    this.userAgency =  {};
    if (window.cache.currentUser && window.cache.currentUser.agency) {
      this.userAgency = window.cache.currentUser.agency;
    }
    this.initAgencyFilter();
    this.taskFilteredCount = 0;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters, this.agency);
  },
    
  render: function () {
    $('#search-results-loading').show();
    var template = _.template(InternshipListTemplate)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      agencyName: this.userAgency.name,
      term: this.filters.term,
      filters: this.filters,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
    });
    this.$el.html(template);
    this.$el.localize();
    this.filter();
    this.initializeKeywordSearch();
    this.$('.usajobs-open-opps-search__box').show();
    return this;
  },
    
  initializeLanguagesList: function () {
    $('#languageId').select2({
      placeholder: 'Start typing to select a language',
      minimumInputLength: 3,
      ajax: {
        url: '/api/ac/languages',
        dataType: 'json',
        data: function (term) {       
          return { q: term };
        },
        results: function (data) { 
          this.language=data;        
          return { results: data };
        },
      },
      dropdownCssClass: 'select2-drop-modal',
      formatResult: function (obj, container, query) {
        return (obj.unmatched ? obj[obj.field] : _.escape(obj[obj.field]));
      },
      formatSelection: function (obj, container, query) {
        return (obj.unmatched ? obj[obj.field] : _.escape(obj[obj.field]));
      },
      formatNoMatches: 'No languages found ',
    });

    $('#languageId').focus();
  },

  initializeAgencyList: function () {
    $('#agencyId').select2({
      placeholder: 'Select Agency',
      minimumInputLength: 3,
      ajax: {
        url: '/api/ac/agency',
        dataType: 'json',
        data: function (term) {       
          return { q: term };
        },
        results: function (data) { 
          this.agency=data;        
          return { results: data };
        },
      },
      dropdownCssClass: 'select2-drop-modal',
      formatResult: function (obj, container, query) {
        return (obj.unmatched ? obj[obj.field] : _.escape(obj[obj.field]));
      },
      formatSelection: function (obj, container, query) {
        return (obj.unmatched ? obj[obj.field] : _.escape(obj[obj.field]));
      },
      formatNoMatches: 'No Agency found ',
    });

    $('#agencyId').focus();
  },

  changedInternsPrograms: function (e){
    // eslint-disable-next-line no-empty
    if($('[name=internship-program]:checked').val()=='sfs'){         
      $('.dossection').hide();
      $('.agencyselect').show();
    }
    if($('[name=internship-program]:checked').val()=='dos'){         
      $('.dossection').show();
      $('.agencyselect').hide();
    }     
  },


  initializeKeywordSearch: function () {
    $('#search').autocomplete({
      source: function (request, response) {
        $.ajax({
          url: '/api/ac/tag',
          dataType: 'json',
          data: {
            type: 'keywords',
            q: request.term.trim(),
          },
          success: function (data) {
            response(_.reject(data, function (item) {
              return _.findWhere(this.filters.keywords, _.pick(item, 'type', 'name', 'id'));
            }.bind(this)));
            $('#search-results-loading').hide();
          }.bind(this),
        });
      }.bind(this),
      minLength: 3,
      select: function (event, ui) {
        event.preventDefault();
        this.filters['keywords'] = _.union(this.filters['keywords'], [_.pick(ui.item, 'type', 'name', 'id')]);
        this.filters.page = 1;
        this.filter();
        $('#search').val('');
      }.bind(this),
    });
  },
    
  initializeSelect2: function () {
    [ 'skill'].forEach(function (tag) {
      var data = this.filters[tag] ? [].concat(this.filters[tag]) : [];
      if(tag == 'location') {
        data = _.filter(data, _.isObject);
      }
      this.tagFactory.createTagDropDown({
        type: tag,
        selector: '#' + tag,
        width: '100%',
        tokenSeparators: [','],
        allowCreate: false,
        maximumSelectionSize: (tag == 'skill' ? 5 : undefined),
        data: data,
      });
      $('#' + tag).on('change', function (e) {
        this.filters[tag] = _.map($(e.target).select2('data'), function (item) {
          return _.pick(item, 'type', 'name', 'id');
        });
       
        this.filters.page = 1;
        this.filter();
      }.bind(this));
    }.bind(this));
         
  },


      
  removeFilter: function (event) {
    event.preventDefault();
    var element = $(event.target).closest('.usajobs-search-pills__item');
    var type = element.data('type');
    var value = element.data('value');
    if(type == 'agency') {
      this.agency = { data: {} };
      delete this.filters.restrict;
    } 
    
    this.filters.page = 1;
    this.filter();
  },
    
  removeAllFilters: function (event) {
    event.preventDefault();
    if(this.filters.career && this.filters.career.name == 'Acquisition') {
      this.filters = { state: [ 'open' ], page: 1 };
    } else {
      this.filters = { state: [], page: 1 };
    }
    this.agency = { data: {} };
    this.filter();
  },
    
  renderFilters: function () {
    if(!_.isEmpty(this.filters.career) && _.isArray(this.filters.career)) {
      this.filters.career = _.pick(_.findWhere(this.tagTypes.career, { name: this.filters.career[0].name }), 'type', 'name', 'id');
    }
    var compiledTemplate = _.template(InternshipFilters)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      userAgency: this.userAgency,
      tagTypes: this.tagTypes,
      language:this.language,
      term: this.filters.term,
      filters: this.filters,
      agency: this.agency,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#task-filters').html(compiledTemplate);
    
    this.initializeSelect2();
    this.initializeLanguagesList();
    this.initializeAgencyList();
   
    
  },
    
  renderList: function (searchResults, page) {
    $('#search-results-loading').hide();
    $('#task-list').html('');
    this.taskFilteredCount = searchResults.totalHits;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters, this.agency);
    $.ajax({
      url: '/api/ac/tag?type=career&list',
      type: 'GET',
      async: false,
      success: function (data) {
        this.tagTypes = { career: data };
        this.renderFilters();
      }.bind(this),
    });
    
    if (searchResults.totalHits === 0 || this.filters.state.length == 0 ) {
      this.renderNoResults();
    } else {
      $('#search-tab-bar-filter-count').text(this.appliedFilterCount);
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
    $('#task-list').append(compiledTemplate);
    $('#task-page').hide();      
    $('#results-count').hide();
  },
    
  renderPage: function (searchResults, page, pageSize) {
    var self = this;
    var start = (page - 1) * pageSize;
    var stop = page * pageSize;
    
    _.each(searchResults.hits, function (value, key) {
      $('#task-list').append(self.renderItem(value.result));
    });
    this.renderResultsCount(start, stop, pageSize, searchResults.totalHits, searchResults.hits.length);
  },
    
  renderResultsCount: function (start, stop, pageSize, numResults, pagedNumResults) {
    if (numResults <= pageSize) {
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + numResults + ' of ' + numResults + ' opportunities');
    } else if (pagedNumResults < pageSize) {
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + (start + pagedNumResults) + ' of ' + numResults + ' opportunities');
    } else {
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + stop + ' of ' + numResults + ' opportunities');
    }
    $('#results-count').show();
  },
    
  renderItem: function (searchResult) {
    searchResult.tags = {};
   
    searchResult.owner.initials = getInitials(searchResult.owner.name);
    var item = {
      item: searchResult,
      user: window.cache.currentUser,
      tagConfig: TagConfig,
      tagShow: ['location', 'skills', 'topic', 'task-time-estimate', 'task-time-required'],
    };
     
    if (searchResult.description) {
      item.item.descriptionHtml = marked(searchResult.description).replace(/<\/?a(|\s+[^>]+)>/g, '');
    }
    return _.template(InternshipListItem)(item);
  },
    
  clickPage: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.filters.page = $(e.currentTarget).data('page');
    this.filter();
    window.scrollTo(0, 0);
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
    $('#task-page').html(pagination);
    $('#task-page').show();
  },
    
  isAgencyChecked: function () {
    return !!$( '#js-restrict-task-filter:checked' ).length;
  },
    
  initAgencyFilter: function () {
    this.agency = { data: {} };
    if (_.contains(this.filters.restrict, 'true')) {
      this.agency.data = this.userAgency;
    }
  },
    
  toggleFilter: function (e) {
    var filterTab = this.$('#search-tab-bar-filter');
    if (filterTab.attr('aria-expanded') === 'true') {
      setTimeout(function () {
        $('#task-filters').css('display', 'none');
    
        $(filterTab).attr('aria-expanded', false);
        $('.usajobs-search-tab-bar__filters-default').attr('aria-hidden', 'false');
        $('.usajobs-search-tab-bar__filter-count-container').attr('aria-hidden', 'false');
        $('.usajobs-search-tab-bar__filters-expanded').attr('aria-expanded', false);
        $('.usajobs-search-filter-nav').attr('aria-hidden', 'true');
    
        $('#title').toggleClass('hide', false);
        $('.navigation').toggleClass('hide', false);
        $('#main-content').toggleClass('hide', false);
        $('.find-people').toggleClass('hide', false);
        $('#footer').toggleClass('hide', false);
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      }, 250);
    } else {
      setTimeout(function () {
        $(filterTab).attr('aria-expanded', true);
        $('.usajobs-search-tab-bar__filters-default').attr('aria-hidden', 'true');
        $('.usajobs-search-tab-bar__filter-count-container').attr('aria-hidden', 'true');
        $('.usajobs-search-tab-bar__filters-expanded').attr('aria-expanded', true);
        $('.usajobs-search-filter-nav').attr('aria-hidden', 'false');
    
        $('#title').toggleClass('hide', true);
        $('.navigation').toggleClass('hide', true);
        $('#main-content').toggleClass('hide', true);
        $('.find-people').toggleClass('hide', true);
        $('#footer').toggleClass('hide', true);
        $('#task-filters').css('display', 'block');
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
      }, 250);
    }
  },
    
  search: function () {
    this.filters.term = this.$('#search').val().trim();
    if (this.filters.term.toLowerCase() == 'acquisition') {
      var item = _.find(this.tagTypes.career, function (t) { 
        return t.name.toLowerCase() == 'acquisition';
      });
      this.filters.career = _.pick(item, 'type', 'name', 'id');
      this.filters.term = '';
      $('#search').val('');
    }
    this.filters.page = 1;
    this.filter();
  },
     
  agencyFilter: function (event) {
    var isChecked = event.target.checked;
    this.filters.state = _( $( '#stateFilters input:checked' ) ).pluck( 'value' );
    if (isChecked) {
      this.filters.restrict = ['true'];
    } else { delete this.filters.restrict; }
        
    this.initAgencyFilter();
    if ( isChecked ) {
      this.filter();
    } else {
      this.filter();
    }
  },
    
  filter: function () {
    this.addFiltersToURL();
    $.ajax({
      url: '/api/task/search' + location.search,
      type: 'GET',
      async: true,
      success: function (data) {
        this.renderList(data, this.filters.page || 1);
        if ($('#search-tab-bar-filter').attr('aria-expanded') === 'true') {
          $('.usajobs-search-filter-nav').attr('aria-hidden', 'false');
        }
      }.bind(this),
    });
  },
    
  empty: function () {
    this.$el.html('');
  },
    
  cleanup: function () {
    removeView(this);
  },
    
  addFiltersToURL: function () {
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
    
  },
    
  parseURLToFilters: function () {
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
        this.filters[key] = _.map(values, function (value) {
          if (key == 'location' && value == 'virtual') {
            return value;
          } else {
            var splitValue = value.split(':');
            if (splitValue[1]) {
              return { type: key, name: splitValue[0], id: parseInt(splitValue[1]) };
            } else {
              return value;
            }
          }
        });
      }
    }.bind(this));
  },
});
    
function formatObjectForURL (value) {
  if (value.type && !value.id) {
    return value.name + ':' + 0;
  } else if (value.id) {
    return value.id ? value.name + ':' + value.id : value.name;
  }
  
  return value.id ? value.name + ':' + value.id : value.name;
}
  
function getAppliedFiltersCount (filters, agency) {
  var count = 0;
  _.each(filters, function ( value, key ) {
    if (key != 'term' && key != 'page') {
      count += (_.isArray(value) ? value.length : 1);
    }
  });
  return count + (_.isEqual(agency, { data: {} }) ? 0 : 1);
}
  
module.exports= InternshipListView;