var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TagFactory = require('../../../../components/tag_factory');
var InternshipListItem = require('../templates/internship_search_item.html');
var InternshipListTemplate = require('../templates/internship_search_template.html');
var SearchPills = require('../templates/search_pills.html');
var NoListItem = require('../templates/no_search_results.html');
var Pagination = require('../../../../components/pagination.html');
var InternshipFilters = require('../templates/internship_filters.html');
var InternshipCycle = require('../templates/internship_search_cycle_box.html');

var InternshipListView = Backbone.View.extend({
  events: {
    'click #search-button'                    : 'search',   
    'change #js-restrict-task-filter'         : 'agencyFilter',
    'click a.page'                            : 'clickPage',
    'click #search-tab-bar-filter'            : 'toggleFilter',
    'click .usajobs-search-filter-nav__back'  : 'toggleFilter',
    'click .usajobs-search-pills__item'       : 'removeFilter',
    'click #search-pills-remove-all'          : 'removeAllFilters',
    'click .internship-link'                  : 'loadInternship',
    // 'change input[type=radio][name=internship-program]'  : 'changedInternsPrograms',
  },
    
  initialize: function (options) {
    this.el = options.el;
    this.tagFactory = new TagFactory();
    this.collection = options.collection;
    this.queryParams = options.queryParams;
    this.filters = { term: this.queryParams.search, page: 1 };
    this.options = options;
    this.cycles = {};
    this.programs = [];
    this.bureaus = [];
    this.offices = {};
    this.currentOffices = [];
    this.filterLookup = {};
    this.firstFilter = true;
    this.userAgency =  {};
    if (window.cache.currentUser && window.cache.currentUser.agency) {
      this.userAgency = window.cache.currentUser.agency;
    }
    this.initAgencyFilter();
    this.initializeHideFields();
    this.initializeCycle();
    this.initializeBureaus();  
    this.initializeCommunityDetails();
    this.parseURLToFilters();
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
      term: this.filters.term ? this.filters.term : '',
      filters: this.filters,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,    
    });
    this.$el.html(template);
    this.$el.localize();
    this.filter();
    this.renderCycle();
    this.initializeKeywordSearch();
    this.initializeLocationSearch(); 
    $('.usa-footer-search--intern').show();
    $('.usa-footer-search--intern-hide').hide();
    this.$('.usajobs-open-opps-search__box').show();
    return this;
  },

  cleanup: function () {
    $('.usa-footer-search--intern-hide').show();
    $('.usa-footer-search--intern').hide();
    removeView(this);
  },

  loadInternship: function (event) {
    event.preventDefault && event.preventDefault();
    Backbone.history.navigate(event.currentTarget.pathname + event.currentTarget.search, { trigger: true });
  },

  // changedInternsPrograms: function (e){
  //   this.filters['program'] = { 'type': 'program', 'name': $('[name=internship-program]:checked').val(), 'id': $('[name=internship-program]:checked').attr('id') };
  //   this.checkInternsPrograms();
  //   this.filters.page = 1;
  //   this.filter();
  // },

  // checkInternsPrograms: function () {
  //   var studentProgram= $('[name=internship-program]:checked + label').text();
  //   var communityId= $('[name=internship-program]:checked').attr('id');
    
  //   if($('[name=internship-program]:checked').val()=='U.S. Department of State Student Internship Program (Unpaid)'){ 
  //     delete this.filters.agency;        
  //     $('.dossection').show();
  //     $('.agencyselect').hide();
  //   }
  //   else if ($('[name=internship-program]:checked').val()=='Virtual Student Federal Service (VSFS)') {          
  //     $('.dossection').hide();
  //     $('.agencyselect').show();
  //   } 
  //   this.selected= studentProgram;
   
  // },

  renderCycle:function (){
    //communityId for Usdos
    var USDOS = _.findWhere(this.programs, { communityName: 'U.S. Department of State Student Internship Program (Unpaid)' }) || {};
    var communityId = USDOS.communityId;
    var cycleData = [];
    if (communityId in this.cycles) {
      cycleData = this.cycles[communityId];
    }
    var  cycleTemplate= _.template(InternshipCycle)({
      selected: this.selected,
      cycles: cycleData,
    });
    $('#cycleId').html(cycleTemplate);
  },

  initializeCycle: function (communityId) {   
    $.ajax({
      url: '/api/cycle/',
      type: 'GET',
      async: false,
      success: function (data) {     
        this.cycles = {};
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        for (var i = 0; i < data.length; i++) {
          var communityId = data[i].communityId;
          var cycleStartDate = new Date(data[i].cycleStartDate);
          var startDate = new Date(data[i].applyStartDate);
          var endDate = new Date(data[i].applyEndDate);
          var today = new Date(moment().tz("America/New_York").format('MM-DD-YYYY'));
          if (!(communityId in this.cycles)) {
            this.cycles[communityId] = [];
          }
          if (today >= startDate && endDate >= today) {
            this.cycles[communityId].push(_.extend(data[i], { 
              applyEndMonth: months[endDate.getMonth()],
              applyEndDay: endDate.getDate(), 
              applyEndYear: endDate.getFullYear(),
              cycleStartYear: cycleStartDate.getFullYear(),
            }));
          }
        } 
      }.bind(this),
    });
  },

  initializeBureaus: function () {
    $.ajax({
      url: '/api/enumerations/bureaus', 
      type: 'GET',
      async: false,
      success: function (data) {
        this.filterLookup['bureau'] = {};
        this.filterLookup['office'] = {};
        for (var i = 0; i < data.length; i++) {
          this.offices[data[i].bureauId] = data[i].offices ? data[i].offices : [];
          this.filterLookup['bureau'][data[i].bureauId] = data[i].name;
          data[i].offices.forEach(function (office) {
            this.filterLookup['office'][office.id] = office.text;
          }.bind(this));
        }
        this.bureaus = data.sort(function (a, b) {
          if(a.name < b.name ) { return -1; }
          if(a.name > b.name ) { return 1; }
          return 0;
        });
      }.bind(this),
    });
  },

  initializeCommunityDetails: function () {  
    $.ajax({
      url: '/api/communities/Students/details' ,
      type: 'GET',
      async: false,
      success: function (data) {      
        this.programs = data;
        this.filterLookup['program'] = {};
        data.forEach(function (program) {
          this.filterLookup.program[program.communityId] = program.communityName;
        }.bind(this));
      }.bind(this),
    });
  },

  initializeKeywordSearch: function () {
    $('#nav-keyword').autocomplete({
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
  
  initializeLocationSearch: function () {
    var locationAC = $.widget('custom.locationAC', $.ui.autocomplete, {
      _create: function () {
        this._super();
        this.widget().menu('option', 'items', '> :not(.ui-autocomplete-category)');
      },
      _renderMenu: function (ul, items) {
        ul.addClass('usajobs-search-location-autocomplete');
        var that = this,
            currentCategory = '',
            header = '<li class="ui-autocomplete-close-header">Close &nbsp;&nbsp;&times;</li>',
            $header = $(header);
    
        $.each(items, function (index, item) {
          var li;
          if (item.type !== currentCategory) {
            ul.append('<li class="ui-autocomplete-category ' + item.type + ' ">' + item.type + '</li>');
            currentCategory = item.type;
          }
          li = that._renderItemData(ul, item);
          if (item.Type) {
            li.attr('aria-label', item.type + ' : ' + item.value);
          }
        });
      },
      _renderItem: function (ul, item) {
        return $('<li>')
          .addClass(item.type)
          .attr('data-value', item.value)
          .append($('<a>').html(item.label))
          .appendTo(ul);
      },
    });

    $('#nav-location').locationAC({
      source: function (request, response) {
        $.ajax({
          url: 'https://data.test.usajobs.gov/api/autocomplete/location',
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
        this.addLocation(ui.item.actualValue);

        $('#nav-location').val('');
        this.filter();
      }.bind(this),
    });
  },

  initializeSelect2: function () {
    ['skill', 'language', 'agency'].forEach(function (tag) {
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
        maximumSelectionSize: 5,
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

    $('#bureau').select2({
      placeholder: 'Select a bureau',
      width: '100%',
      allowClear: true,
    });
    if($('#bureau').select2('data')) {
      this.showOfficeDropdown();
    }
    $('#bureau').on('change', function (e) {
      this.showOfficeDropdown();
      $('#office').val(null).trigger('change');
      this.filters.page = 1;
      this.filter();
    }.bind(this));

    $('#office').select2({
      placeholder: 'Select an office/post',
      width: '100%',
      allowClear: true,
      data: function () { 
        return {results: this.currentOffices}; 
      }.bind(this),
    });

    $('#office').on('change', function (e) {
      if($('#office').select2('data')) {
        var selectData = $('#office').select2('data');
        this.filters.office = { type: 'office', id: selectData.id, name: selectData.text };
      } else {
        delete this.filters.office;
      }
      this.filters.page = 1;
      this.filter();
    }.bind(this));
  },

  showOfficeDropdown: function () {
    if($('#bureau').select2('data')) {
      var selectData = $('#bureau').select2('data');
      this.filters.bureau = { type: 'bureau', id: selectData.id, name: selectData.text };
      this.currentOffices = this.offices[selectData.id];
      $('.office_section').show();
    } else {
      delete this.filters.bureau;
      $('.office_section').hide();
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
    this.filters = { state: [], page: 1 };    
    this.agency = { data: {} };
    this.filter();
  },
    
  renderFilters: function () {
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
      programs :this.programs,
      bureaus: this.bureaus,
    });
    $('#task-filters').html(compiledTemplate);
    compiledTemplate = _.template(SearchPills)({
      filters: this.filters,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#usajobs-search-pills').html(compiledTemplate);
    this.initializeSelect2();
    this.initializeHideFields();
    // this.checkInternsPrograms();
  },
  initializeHideFields:function (){
    // $('.dossection').hide();
    $('.agencyselect').hide();
  },


  renderList: function (searchResults, page) {
    $('#search-results-loading').hide();
    $('#task-list').html('');
    this.taskFilteredCount = searchResults.totalHits;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters, this.agency);
    this.renderFilters();
    
    if (searchResults.totalHits === 0) {
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
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + numResults + ' of ' + numResults + ' internship opportunities');
    } else if (pagedNumResults < pageSize) {
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + (start + pagedNumResults) + ' of ' + numResults + ' internship opportunities');
    } else {
      $('#results-count').text('Viewing ' +  (start + 1) + ' - ' + stop + ' of ' + numResults + ' internship opportunities');
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
  
  addLocation: function (location) {
    if(location == 'USA') {
      location = 'United States';
    }
    if (this.filters.location && _.isArray(this.filters.location)) {
      this.filters.location.push(location.trim());
    } else {
      this.filters.location = [location.trim()];
    }
    this.filters.page = 1;
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
    this.filters.term = this.$('#nav-keyword').val().trim();
    if (this.$('#nav-location').val().trim() != '') {
      this.addLocation($('#nav-location').val());
    }
    this.$('#nav-location').val('');
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
    this.filters.page = 1;
    this.filter();
  },
    
  filter: function () {
    this.addFiltersToURL();
    $.ajax({
      url: '/api/task/search' + location.search + '&isInternship=1',
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
  },
});
    
function formatObjectForURL (value) {
  if (value.type == 'program' || value.type == 'office' || value.type == 'bureau') {
    return value.id;
  }
  else {
    return value.name;
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

function splitTermHighlighter (s, t) {
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
}
  
module.exports= InternshipListView;