var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminAgenciesTemplate = require('../templates/admin_agencies_template.html');
var AdminAgencyTasks = require('../templates/admin_agency_task_metrics.html');

var AdminAgenciesView = Backbone.View.extend({

  events: {
    'click #accept-toggle'  : 'toggleAccept',
    'click .link'           : 'link',
    'change #agencies'      : 'changeAgency',
    'change .group'         : 'renderTasks', 
    'change input[name=type]':'renderTasks',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.agencyId = options.agencyId || window.cache.currentUser.agency.agencyId; 
  },
  render: function (replace) { 
    this.$el.show();
    this.loadAgencyData();
    $('#search-results-loading').hide();
    Backbone.history.navigate('/admin/agency/' + this.agencyId, { replace: replace });
    return this;
  },

  renderTasks: function () {
    var self=this,
        group = this.$('.group').val() || 'fy',
        filter = this.$('input[name=type]:checked').val() || '',
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    var today = new Date();
    var currentYear = today.getFullYear();  
    currentYear=currentYear.toString();
    var previousYear = parseInt(currentYear)-1;
    previousYear= previousYear.toString();
    function label (key) {
      if (key === 'undefined') return 'No date';   
      return group === 'week' ? 'W' + (+key.slice(4)) + '\n' + key.slice(0,4):
        group === 'month' ? months[key.slice(4) - 1]  + '\n' + key.slice(0,4) :
          group === 'quarter' ? 'Q' + (+key.slice(4)) + '\n' + key.slice(0,4) :
            group === 'fyquarter' ? 'Q' + (+key.slice(4)) + '\nFY' + key.slice(0,4) :
              group === 'fy' ? 'FY' + key : key;            
    }
    $.ajax({
      url: '/api/admin/agency/taskmetrics/'+ this.agencyId +'?group=' + group + '&filter=' + filter,
      dataType: 'json',
      success: function (data) {        
        data.label = label;     
        if(group=='fy'){
         
          var year= [currentYear, previousYear];
          data.range = _.filter(data.range, function (i) {
            return _.contains(year, i);
          });
        }      
        if(group=='month'){            
          self.generateMonthsDisplay(data,currentYear,previousYear);
        }
        if(group=='quarter'){
          self.generateQuartersDisplay(data,currentYear,previousYear);       
        }           
        var template = _.template(AdminAgencyTasks)(data);
        $('#search-results-loading').hide();     
        self.$('.task-metrics').html(template);
        self.$el.localize();
        self.$('.task-metrics').show();
        self.$('.group').val(group);  
        self.$('input[name=type][value="' + filter +'"]').prop('checked', true);      
      }.bind(this),
    });
  },
  quarter: function () {
    var today = new Date();
    var year = today.getFullYear();
    var month = (today.getMonth()+ 1).toString(); 
    var quarter;
    if      (month <= 3) { quarter = '1'; }
    else if (month <= 6) { quarter = '2'; }
    else if (month <= 9) { quarter = '3'; }
    else                 { quarter = '4'; }
    return year+''+quarter;
  }.bind(this),

  generateMonthsDisplay: function (data,currentYear,previousYear){
   
    var Myear= [previousYear];  
    var previousYearRange= [];
    previousYearRange  = _.filter(data.range, function (di) {
      return _.contains(Myear, di.slice(0,4));
    });
    var months=[previousYear+'01',+previousYear+'02',previousYear+'03',
      +previousYear+'04',+previousYear+'05',+previousYear+'06',+previousYear+'07',
      +previousYear+'08',+previousYear+'09',+previousYear+'10',+previousYear+'11',
      +previousYear+'12'];

    if(previousYearRange.length>0){
      var updateArray= _.difference(months,previousYearRange); 
      var previousYearData=_.chain(updateArray).sort().value(); 
      var previousYearDataUnion= _.union(previousYearData,previousYearRange).sort();
    }
    var currentMYear= [currentYear]; 
    var currentYearRange  = _.filter(data.range, function (di) {
      return _.contains(currentMYear, di.slice(0,4));
    });
    var today = new Date();
    var year = today.getFullYear();
    var month = (today.getMonth()+ 1).toString();        
    var currentYearMonth;      
    if(month.length<2){
      currentYearMonth = year +'0'+ month;
    }
    else{
      currentYearMonth= year +''+ month;
    }      
    var monthsCurrent=[currentYear+'01',+currentYear+'02',currentYear+'03',
      +currentYear+'04',+currentYear+'05',+currentYear+'06',+currentYear+'07',
      +currentYear+'08',+currentYear+'09',+currentYear+'10',+currentYear+'11',
      +currentYear+'12'];

    monthsCurrent= _.filter(monthsCurrent,function (e){
      return  e <= currentYearMonth;
    });
    if(currentYearRange.length>0 || previousYearRange.length>0){
      var updateCurrentArray= _.difference(monthsCurrent,currentYearRange); 
      var currentYearData=_.chain(updateCurrentArray).sort().value(); 
      var currentYearDataUnion= _.union(currentYearData,currentYearRange).sort();  
      data.range=_.union(previousYearDataUnion,currentYearDataUnion).sort();
    }
    else{
      data.range=[];
    }
  },

  generateQuartersDisplay: function (data,currentYear,previousYear){
    var Myear= [previousYear];  
    var previousYearRange= [];
    previousYearRange  = _.filter(data.range, function (di) {
      return _.contains(Myear, di.slice(0,4));
    });
    var months=[previousYear+'1',previousYear+'2',previousYear+'3',
      previousYear+'4'];
    if(previousYearRange.length>0){
      var updateArray= _.difference(months,previousYearRange); 
      var previousYearData=_.chain(updateArray).sort().value(); 
      var previousYearDataUnion= _.union(previousYearData,previousYearRange).sort();
    }
    var currentMYear= [currentYear];
    var currentYearRange=[];
    currentYearRange  = _.filter(data.range, function (di) {
      return _.contains(currentMYear, di.slice(0,4));
    });
    
    var monthsCurrent=[currentYear+'1',currentYear+'2',currentYear+'3',
      currentYear+'4'];
    var currentQuarter=this.quarter();
    monthsCurrent= _.filter(monthsCurrent,function (m){
      return  m <= currentQuarter;
    });
    if(currentYearRange.length>0 || previousYearRange.length>0){
      var updateCurrentArray= _.difference(monthsCurrent,currentYearRange); 
      var currentYearData=_.chain(updateCurrentArray).sort().value(); 
      var currentYearDataUnion= _.union(currentYearData,currentYearRange).sort();  
      data.range=_.union(previousYearDataUnion,currentYearDataUnion).sort();
    }
    else{
      data.range=[];
    }
  },

  loadAgencyData: function () {
    // get meta data for agency
    $.ajax({
      url: '/api/admin/agency/' + this.agencyId,
      dataType: 'json',
      success: function (agencyInfo) {     
        this.loadInteractionsData(function (interactions) {
          agencyInfo.interactions = interactions;
          agencyInfo.slug = (agencyInfo.abbr || '').toLowerCase();
          var template = _.template(AdminAgenciesTemplate)({
            agency: agencyInfo,
            departments: this.options.departments,
          });
          this.$el.html(template);
          if(this.options.departments) {
            this.initializeAgencySelect();
          }
        }.bind(this));
        this.renderTasks.bind(this)();
      }.bind(this),
    });
  },

  loadInteractionsData: function (callback) {
    $.ajax({
      url: '/api/admin/agency/' + this.agencyId + '/interactions/',
      dataType: 'json',
      success: function (interactions) {
        interactions.count = _(interactions).reduce(function (sum, value, key) {
          return sum + value;
        }, 0);
        callback(interactions);
      },
    });
  },

  initializeAgencySelect: function () {
    setTimeout(function () {
      $('#agencies').select2({
        placeholder: 'Select an agency',
        allowClear: false,
      });
      try {
        $('#s2id_agencies').children('.select2-choice').children('.select2-search-choice-close').remove();
      } catch (error) { /* swallow exception because close image has already been removed*/ }
    }, 50);
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.agency.agencyId);
  },

  toggleAccept: function (e) {
    var toggleOn = $(e.currentTarget).hasClass('toggle-off');
    var state = this.model.attributes.state.toLowerCase();
    if(state == 'open' && !toggleOn) {
      state = 'not open';
    } else if (state == 'not open' && toggleOn) {
      state = 'open';
    }
    $.ajax({
      url: '/api/task/state/' +  this.model.attributes.id,
      type: 'PUT',
      data: {
        id: this.model.attributes.id,
        state: state,
        acceptingApplicants: toggleOn,
      },
      success: function (data) {
        if(toggleOn) {
          $(e.currentTarget).removeClass('toggle-off');
        } else {
          $(e.currentTarget).addClass('toggle-off');
        }
        this.updatePill(state, toggleOn);
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  changeAgency: function (event) {
    if($('#agencies').val()) {
      Backbone.history.navigate('/admin/agency/' + $('#agencies').val(), { trigger: true });
      this.renderTasks();
    }
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAgenciesView;