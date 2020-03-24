var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TagFactory = require('../../../../components/tag_factory');
var TaskListTemplate = require('../templates/task_search_template.html');
var TaskListItem = require('../templates/task_search_item.html');
var NoListItem = require('../templates/no_search_results.html');
var Pagination = require('../../../../components/pagination.html');
var TaskFilters = require('../templates/task_filters.html');
var SearchPills = require('../templates/search_pills.html');
var TaskSearchBanner = require('../templates/task_search_banner.html');

var removeMd = require('remove-markdown');
var select2Custom = require('../../../../../vendor/select2-3.4.6.custom');


var TaskListView = Backbone.View.extend({
  events: {
    'click #search-button'                    : 'search',
    'change #stateFilters input'              : 'stateFilter',
    'change #timeFilters input'               : 'timeFilter',
    'change #detailFilters input'             : 'detailFilter',
    'change input[name=location]'             : 'locationFilter',
    'click .stateFilters-toggle'              : 'toggleStateFilters',
    'click .timefilters-toggle'               : 'toggleTimeFilters',
    'click .locationfilters-toggle'           : 'toggleLocationFilters',
    'change .restrict-participation'          : 'agencyFilter',
    'click a.page'                            : 'clickPage',
    'click #search-tab-bar-filter'            : 'toggleFilter',
    'click .usajobs-search-filter-nav__back'  : 'toggleFilter',
    'click .usajobs-search-pills__item'       : 'removeFilter',
    'click #search-pills-remove-all'          : 'removeAllFilters',
    'click .task-link'                        : 'loadTask',
  },

  initialize: function (options) {
    this.el = options.el;
    this.tagFactory = new TagFactory();
    this.collection = options.collection;
    this.queryParams = options.queryParams;
    this.communities = [];
    this.careers = [];
    this.filters = { state: 'open', term: this.queryParams.search, page: 1 };
    this.firstFilter = true;
    this.userAgency =  {};
    this.agencies = [];
    this.payPlans =[];
    this.filterLookup = {};
    if (window.cache.currentUser && window.cache.currentUser.agency) {
      this.userAgency = window.cache.currentUser.agency;
      this.loadAgencies(window.cache.currentUser.agency);
    }
    this.initAgencyFilter();
    this.initializeCommunityField();
    this.initializeCareerField();
    this.initializePayPlanField();
    this.parseURLToFilters();
    this.taskFilteredCount = 0;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters, this.agency);

  },

  loadAgencies: function (agency) {
    this.agencies.push(agency);
    if(agency.parent) {
      this.loadAgencies(agency.parent);
    }
  },

  render: function () {
    $('#search-results-loading').show();
    var template = _.template(TaskListTemplate)({
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

  renderCommunitySearchBanner: function () {
    $('#search-banner').html(_.template(TaskSearchBanner)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      agencyName: this.userAgency.name,
      term: this.filters.term,
      filters: this.filters,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
    }));
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
    ['series', 'skill', 'location'].forEach(function (tag) {
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
        if(tag == 'location') {
          this.filters.locationType = [];
          if($('#virtual').is(':checked')) {
            this.filters.locationType.push('virtual');
          }
          if($('#in-person').is(':checked')) {
            this.filters.locationType.push('in person');
          }
        }
        this.filters.page = 1;
        this.filter();
      }.bind(this));
    }.bind(this));
    if(!_.contains(this.filters.locationType, 'in person')) {
      $('#location').siblings('.select2-container').hide();
    }
    
  },

  initializeCareerSelect2: function () {
    $('#career').select2({
      placeholder: 'Select a career field',
      width: '100%',
      allowClear: true,
    });
    $('#career').on('change', function (e) {
      if($('#career').select2('data')) {
        var career = _.findWhere(this.tagTypes['career'], { id: parseInt($('#career').select2('data').id) });
        this.filters.career = _.pick(career, 'type', 'name', 'id');
      } else {
        this.filters.career = [];
      }
      this.filters.page = 1;
      this.filter();
    }.bind(this));
  },

  initializeCommunitySelect2: function () {
    $('#community').select2({
      placeholder: 'Select a community',
      width: '100%',
      allowClear: true,
    });
    $('#community').on('change', function (e) {
      if($('#community').select2('data')) {
        var c = _.findWhere(this.tagTypes['community'], { communityId: $('#community').select2('data').id });
        this.filters.community = _.pick(c, 'type', 'name', 'id', 'banner', 'imageId', 'communityType');
      } else {
        delete this.filters.community;
      }
      
      this.filters.page = 1;
      this.filter();
    }.bind(this));
  },

  initializeCommunityField: function () {
    $.ajax({
      url: '/api/task/communitylist',
      dataType: 'json',
      async: false,
      success: function (data) {
        this.communities = data.federal;
        this.filterLookup['community'] = {};
        this.communities.forEach(function (community) {
          community.type = 'community';
          community.id = community.communityId;
          community.name = community.communityName;
          this.filterLookup['community'][community.id] = community;
        }.bind(this));
      }.bind(this),
    });
  },

  initializeCareerField: function () {
    $.ajax({
      url: '/api/ac/tag?type=career&list',
      type: 'GET',
      async: false,
      success: function (data) {  
        this.careers = data;
        this.filterLookup['career'] = {};
        data.forEach(function (career) {
          this.filterLookup['career'][career.id] = career.name;
        }.bind(this));
      }.bind(this),
    });
  },

  loadTask: function (event) {
    event.preventDefault && event.preventDefault();
    Backbone.history.navigate(event.currentTarget.pathname + event.currentTarget.search, { trigger: true });
  },

  initializePayPlanField: function () {
    $.ajax({
      url: '/api/enumerations/payPlans', 
      type: 'GET',
      async: false,
      success: function (data) { 
        this.payPlans = data;       
        this.filterLookup['payPlan'] = {};   
        _.each(this.payPlans, function (payPlan){
          payPlan.type = 'payPlan';
          payPlan.id = payPlan.pay_plan_id;
          payPlan.name = payPlan.code;
          this.filterLookup['payPlan'][payPlan.id] = payPlan;     
        }.bind(this));   
      }.bind(this),
    });
  },

  initializePayPlanSelect2: function () {
    $('#time-options-pay-scale').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });
    $('#time-options-pay-scale').on('change', function (e) {
      if($('#time-options-pay-scale').select2('data')) {    
        var selectData = this.$('#time-options-pay-scale').select2('data');  
        this.filters.payPlan = { type: 'payPlan', id: selectData.id ,name: selectData.text};            
      }
      else {
        delete this.filters.payPlan;
      }    
      this.filters.page = 1;
      this.filter();
    }.bind(this));
  },

  initializeInputGrade : function (){
    $('#grade').change(function () {
      if($('#grade').val()!=''){
        this.filters.grade = $('#grade').val();
      }
      else{
        delete this.filters.grade;
      }
      this.filters.page = 1;
      this.filter();
    }.bind(this));
    
  },

  removeFilter: function (event) {
    event.preventDefault();
    var element = $(event.target).closest('.usajobs-search-pills__item');
    var type = element.data('type');
    var value = element.data('value');
    if(_.isArray(this.filters[type])) {
      if(type == 'location' && value == 'in-person') {
        this.filters[type] = _.filter(this.filters[type], function (filter) {
          return filter == 'virtual'; // only return virtual if it exist
        });
      } else {
        this.filters[type] = _.filter(this.filters[type], function (filter) {
          if (_.isObject(value)) {
            return !_.isEqual(filter, value);
          } else {
            return filter != value;
          }
        });
      }
    } else if (_.isEqual(this.filters[type], value) || this.filters[type] == value) {
      delete this.filters[type];
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
    if(!_.isEmpty(this.filters.community) && _.isArray(this.filters.community)) {
      this.filters.community = _.pick(_.findWhere(this.tagTypes.community, { name: this.filters.community[0].name }), 'type', 'name', 'id', 'banner', 'imageId', 'communityType');
    }
    if(!_.isEmpty(this.filters.career) && _.isArray(this.filters.career)) {
      this.filters.career = _.pick(_.findWhere(this.tagTypes.career, { name: this.filters.career[0].name }), 'type', 'name', 'id');
    }
    if(!_.isEmpty(this.filters.payPlan) && _.isArray(this.filters.payPlan)) {
      this.filters.payPlan = _.pick(_.findWhere(this.tagTypes.payPlan, { code: this.filters.payPlan[0].name }), 'type','name','id');
    }  
    var compiledTemplate = _.template(TaskFilters)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      userAgency: this.userAgency,
      agencies: this.agencies,
      tagTypes: this.tagTypes,
      term: this.filters.term,
      filters: this.filters,
      agency: this.agency,
      payPlans:this.payPlans,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#task-filters').html(compiledTemplate);
    compiledTemplate = _.template(SearchPills)({
      filters: this.filters,
      agencies: this.agencies,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#usajobs-search-pills').html(compiledTemplate);
    this.initializeSelect2();
    this.initializeInputGrade();
    this.initializePayPlanSelect2();
    this.displayPayPlanGrade();

    setTimeout(function () {
      this.initializeCommunitySelect2();
    }.bind(this), 100);
    setTimeout(function () {
      this.initializeCareerSelect2();  
    }.bind(this), 100);
  },

  renderList: function (searchResults, page) {
    $('#search-results-loading').hide();
    $('#task-list').html('');
    this.taskFilteredCount = searchResults.totalHits;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters, this.agency);
    this.tagTypes = { career: this.careers, community: this.communities ,payPlan:this.payPlans };
    this.renderFilters();

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
    var compiledTemplate = _.template(NoListItem)(settings);
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
    if (searchResult.locations && searchResult.locations.length > 0) {
      searchResult.tags['location'] = [searchResult.locations[0]];
    }
    
    searchResult.owner.initials = getInitials(searchResult.owner.name);
    var item = {
      item: searchResult,
      user: window.cache.currentUser,
      tagConfig: TagConfig,
      tagShow: ['location', 'skills', 'topic', 'task-time-estimate', 'task-time-required'],
    };
 
    if (searchResult.description) {
      item.item.descriptionHtml = marked(searchResult.description).replace(/<\/?a(|\s+[^>]+)>/g, '');
      item.item.descriptionHtml = removeMd(item.item.descriptionHtml);
    }
    return _.template(TaskListItem)(item);
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
    [].concat(this.filters.restrict).forEach((id) => {

    });
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

  toggleStateFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#stateFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.stateFilter();
  },

  toggleTimeFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#timeFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.timeFilter();
    var checkBoxes2 = $('#detailFilters input[type="checkbox"]');
    checkBoxes2.prop('checked', behavior == 'select');
    this.detailFilter();
  },

  toggleLocationFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#locationFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.locationFilter();
  },

  stateFilter: function (event) {
    this.filters.state = _($('#stateFilters input:checked')).pluck('value');
    this.filters.page = 1;
    this.filter();
  },

  timeFilter: function (event) {
    this.displayPayPlanGrade(); 
    this.filters.time = _($('#timeFilters input:checked')).pluck('value').map(function (value) {
      return value;
    });
    this.filters.page = 1;
    this.filter(); 
  },

  detailFilter: function (event) {
    this.filters.detailSelection = _($('#detailFilters input:checked')).pluck('value').map(function (value) {
      return value;
    });
    this.filters.page = 1;
    this.filter();
  },

  displayPayPlanGrade : function (){
    if($('#detail').is(':checked') || $('#lateral').is(':checked')) { 
      $('#pay-scale-grade').show();  
    }
    else {  
      $('#pay-scale-grade').hide();  
      delete this.filters.grade;
      delete this.filters.payPlan;
    }
  },

  locationFilter: function (event) {
    if(!$('#in-person').is(':checked')) {
      $('#location').siblings('.select2-container').hide();
      $('#location').select2('data', null);
    } else {
      $('#location').siblings('.select2-container').show();
    }
    this.filters.location = _.map($('#location').select2('data'), function (item) {
      return _.pick(item, 'type', 'name', 'id');
    });
    this.filters.locationType = [];
    if($('#virtual').is(':checked')) {
      this.filters.locationType.push('virtual');
    }
    if($('#in-person').is(':checked')) {
      this.filters.locationType.push('in person');
    }
    this.filters.page = 1;
    this.filter();
  },

  agencyFilter: function (event) {
    var isChecked = event.target.checked;
    this.filters.restrict = _($('#agencyFilters input:checked')).pluck('value');
    
    this.initAgencyFilter();
    if ( isChecked ) {
      this.filter();
    } else {
      this.filter();
    }
  },

  filter: function () {
    // Remove lateral from non agency community types
    if (!this.filters.community || this.filters.community.communityType != 3) {
      if(_.isArray(this.filters.time)) {
        this.filters.time = _.reject(this.filters.time, (value) => { return value.match(/^lateral$/i); });
      } else if (this.filters.time && this.filters.time.match(/^lateral$/i)) {
        delete this.filters.time;
      }
    }
    this.addFiltersToURL();
    this.renderCommunitySearchBanner();
    $.ajax({
      url: '/api/task/search' + location.search + '&isInternship=0',
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
      var values = _.isArray(value) ? value : value.split(';');
      if (key == 'term') {
        this.filters.term = value;
      } else if (key == 'page') {
        if (!isNaN(value)) {
          this.filters.page = parseInt(value);
        }
      } else if (key == 'community') {
        this.filters.community = {
          type: key,
          name: this.filterLookup[key][value].name,
          id: value,
          banner: this.filterLookup[key][value].banner,
          imageId: this.filterLookup[key][value].imageId,
          communityType: this.filterLookup[key][value].communityType,
        };
      } else {
        this.filters[key] = _.map(values, function (value) {
          if (value == 'virtual') {
            return value;
          } else if (key == 'career') {
            return { type: key, name: this.filterLookup[key][value], id: value };
          } else if (key == 'payPlan') {        
            return { type: key, name: this.filterLookup[key][value].name, id: value };
          } else if (key == 'location' || key == 'skill' || key == 'series' || key == 'detailSelection') {
            var parts = value.split('|');
            return { type: key, name: parts[0], id: parts[1] };
          } else {
            return value;
          }
        }.bind(this));
      }
    }.bind(this));
  },
});

function formatObjectForURL (value) {
  if (value.type == 'career' || value.type == 'community' || value.type == 'payPlan') {
    return value.id;
  } else {
    return value.name + (value.id ? '|' + value.id : '' );
  }
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


module.exports = TaskListView;
