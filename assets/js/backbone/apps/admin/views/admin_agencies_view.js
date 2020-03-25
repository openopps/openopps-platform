var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var marked = require('marked');
var select2Custom = require('../../../../vendor/select2-3.4.6.custom');

var AdminAgenciesTemplate = require('../templates/admin_agencies_template.html');
var AdminAgencyTasks = require('../templates/admin_agency_task_metrics.html');
var AdminAgenciesDashboardActivitiesTemplate = require('../templates/admin_agencies_dashboard_activities_template.html');
var AdminAgencyImageTemplate = require('../templates/admin_agency_image_template.html');
var Modal = require('../../../components/modal');
var AdminTopContributorsView = require('./admin_top_contributors_view');

var AdminAgenciesView = Backbone.View.extend({

  events: {
    'click #accept-toggle'    : 'toggleAccept',
    'click .link'             : 'link',
    'change #agencies'        : 'changeAgency',
    'change .group'           : 'renderTasks', 
    'change input[name=type]' : 'renderTasks',
    'click #logo-remove'      : 'removeLogo',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.agencyId = options.agencyId || window.cache.currentUser.agency.agency_id; 
  },

  render: function (replace) { 
    this.$el.show();
    this.loadAgencyData();
    $('#search-results-loading').hide();
    Backbone.history.navigate('/admin/agency/' + this.agencyId, { replace: replace });
    return this;
  },

  renderTasks: function () {
    var self = this,
        group = this.$('.group').val() || 'fy',
        filter = this.$('input[name=type]:checked').val() || '',
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
   
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
        if (group == 'fy') {
          var today = new Date();
          var currentYear = (today.getFullYear() + (today.getMonth() >= 9 ? 1 : 0)).toString();
          var previousYear= currentYear-1;       
          previousYear= previousYear.toString();    
          var year= [currentYear,previousYear];
          data.range = year;
        }
        if (group == 'month') {
          self.generateMonthsDisplay(data);
        }
        if (group == 'quarter') {
          self.generateQuartersDisplay(data);
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

  initializeFileUpload: function () {
    $('#fileupload').fileupload({
      url: '/api/upload/create',
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
      formData: { 'type': 'image' },
      add: function (e, data) {
        $('#file-upload-progress-container').show();
        data.submit();
      }.bind(this),
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#file-upload-progress').css('width', progress + '%');
      }.bind(this),
      done: function (e, data) {
        this.updatePhoto(data.result.id);
        $('#file-upload-progress-container').hide();
        $('#file-upload-alert').hide();
      }.bind(this),
      fail: function (e, data) {
        var message = data.jqXHR.responseText || data.errorThrown;
        $('#file-upload-progress-container').hide();
        if (data.jqXHR.status == 413) {
          message = 'The uploaded file exceeds the maximum file size.';
        }
        $('#file-upload-alert-message').html(message);
        $('#file-upload-alert').show();
        window.scrollTo(0, 0);
      }.bind(this),
    });
  },

  renderLogoTemplate: function () {
    var imageTemplate = _.template(AdminAgencyImageTemplate)({ agency: this.agency });   
    $('#image-logo').html(imageTemplate);
    setTimeout(() => {
      this.initializeFileUpload();
    }, 50);
  },

  updatePhoto: function (imageId) {
    // TODO: Update agency record
    $.ajax({
      url: '/api/admin/agency/logo/' + this.agency.agencyId,
      type: 'POST',
      data: {
        imageId: imageId,
        agencyId: this.agency.agencyId,
        updatedAt: this.agency.updatedAt,
      }, 
    }).done(function (data) {
      this.agency.imageId = imageId;
      this.agency.updatedAt = data.updatedAt;
      this.renderLogoTemplate();
    }.bind(this));
  },

  removeLogo: function (event) {
    var deleteModal = new Modal({
      id: 'confirm-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Confirm image removal',
      modalBody: 'Are you sure you want to remove the agency logo? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Remove',
        action: function () {
          $.ajax({
            url: '/api/admin/agency/logo/remove/' + this.agency.imageId,
            type: 'POST',
            data: {
              imageId: null,
              agencyId: this.agency.agencyId,
              updatedAt: this.agency.updatedAt,
            }, 
          }).done(function (data) {
            this.agency.imageId = null;
            this.agency.updatedAt = data.updatedAt;
            this.renderLogoTemplate();
          }.bind(this));
          deleteModal.cleanup();
        }.bind(this),
      },
    });
    deleteModal.render();
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
    return year + '' + quarter;
  }.bind(this),

  generateMonthsDisplay: function (data) {
    var today = new Date();
    var currentYear = today.getFullYear();  
    currentYear = currentYear.toString();
    var previousYear = parseInt(currentYear)-1;  
    previousYear=previousYear.toString();
    var Myear = [previousYear];
    var previousYearRange = [];
    previousYearRange = _.filter(data.range, function (di) {
      return _.contains(Myear, di.slice(0,4));
    });
    var months = [previousYear+'01',+previousYear+'02',previousYear+'03',
      +previousYear+'04',+previousYear+'05',+previousYear+'06',+previousYear+'07',
      +previousYear+'08',+previousYear+'09',+previousYear+'10',+previousYear+'11',
      +previousYear+'12'];

    if (previousYearRange.length > 0) {
      var updateArray = _.difference(months,previousYearRange);
      var previousYearData =_.chain(updateArray).sort().value();
      var previousYearDataUnion = _.union(previousYearData,previousYearRange).sort();
    }
    var currentMYear = [currentYear];
    var currentYearRange = _.filter(data.range, function (di) {
      return _.contains(currentMYear, di.slice(0,4));
    }); 
    var year = today.getFullYear();
    var month = (today.getMonth()+ 1).toString();
    var currentYearMonth;
    if (month.length < 2) {
      currentYearMonth = year + '0' + month;
    }
    else{
      currentYearMonth= year + '' + month;
    }
    var monthsCurrent = [currentYear+'01',+currentYear+'02',currentYear+'03',
      +currentYear+'04',+currentYear+'05',+currentYear+'06',+currentYear+'07',
      +currentYear+'08',+currentYear+'09',+currentYear+'10',+currentYear+'11',
      +currentYear+'12'];

    monthsCurrent = _.filter(monthsCurrent,function (e) {
      return  e <= currentYearMonth;
    });
    if (currentYearRange.length > 0 || previousYearRange.length > 0) {
      var updateCurrentArray = _.difference(monthsCurrent,currentYearRange);
      var currentYearData = _.chain(updateCurrentArray).sort().value();
      var currentYearDataUnion = _.union(currentYearData,currentYearRange).sort();
      data.range = _.union(currentYearDataUnion,previousYearDataUnion).sort(function (a, b) { return b-a; });
    } else {
      data.range = [];
    }
  },
  generateQuartersDisplay: function (data) {
    var today = new Date();
    var currentYear = today.getFullYear();  
    currentYear = currentYear.toString();
    var previousYear = parseInt(currentYear)-1;
    previousYear= previousYear.toString();
   
    var Myear = [previousYear];
    var previousYearRange = [];
    previousYearRange = _.filter(data.range, function (di) {
      return _.contains(Myear, di.slice(0,4));
    });
    var months = [previousYear+'1',previousYear+'2',previousYear+'3',
      previousYear+'4'];
    if (previousYearRange.length > 0) {
      var updateArray= _.difference(months,previousYearRange);
      var previousYearData=_.chain(updateArray).sort().value();
      var previousYearDataUnion= _.union(previousYearData,previousYearRange).sort();
    }
    var currentMYear = [currentYear];
    var currentYearRange = [];
    currentYearRange = _.filter(data.range, function (di) {
      return _.contains(currentMYear, di.slice(0,4));
    });
    
    var monthsCurrent = [currentYear+'1',currentYear+'2',currentYear+'3',
      currentYear+'4'];
    var currentQuarter = this.quarter();
    monthsCurrent = _.filter(monthsCurrent,function (m){
      return m <= currentQuarter;
    });
    if (currentYearRange.length > 0 || previousYearRange.length > 0) {
      var updateCurrentArray = _.difference(monthsCurrent,currentYearRange);
      var currentYearData =_.chain(updateCurrentArray).sort().value();
      var currentYearDataUnion = _.union(currentYearData,currentYearRange).sort();
      data.range = _.union(currentYearDataUnion,previousYearDataUnion).sort(function (a, b) { return b-a; });
    }
    else{
      data.range = [];
    }
  },

  renderTopContributors: function () {
    if (this.adminTopContributorsView) {
      this.adminTopContributorsView.cleanup();
    }
    this.adminTopContributorsView = new AdminTopContributorsView({
      el: '.admin-top-contributors',
      target: 'agency',
      targetId: this.agencyId,
    });
    this.adminTopContributorsView.render();
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
          this.agency = agencyInfo;
          var template = _.template(AdminAgenciesTemplate)({
            agency: agencyInfo,
            departments: this.options.departments,
          });
          this.$el.html(template);
          setTimeout(function () {
            this.initializeFileUpload();
            this.fetchData(this);
            this.renderTasks();
          }.bind(this), 50);
          if(this.options.departments) {
            this.initializeAgencySelect();
          }
        }.bind(this));     
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
    
    }
  },

  renderActivities: function (self, data) {
    var template = _.template(AdminAgenciesDashboardActivitiesTemplate)(data);
    self.$('.activity-block').html(template);
    _(data).forEach(function (activity) {

      if (!activity || !activity.user ||
        (activity.type === 'newVolunteer' && !activity.task) ||
        (activity.comment && typeof activity.comment.value === 'undefined')
      ) return;

      if (activity.comment) {
        var value = activity.comment.value;

        value = marked(value, { sanitize: false });
        //render comment in single line by stripping the markdown-generated paragraphs
        value = value.replace(/<\/?p>/gm, '');
        value = value.replace(/<br>/gm, '');
        value = value.trim();

        activity.comment.value = value;
      }

      activity.createdAtFormatted = $.timeago(activity.createdAt);
      var template = self.$('#' + activity.type).text(),
          content = _.template(template, { interpolate: /\{\{(.+?)\}\}/g })(activity);
      self.$('.activity-block .activity-feed ul').append(content);
    });

    this.$el.localize();
    self.$('.spinner').hide();
    self.$('.activity-block').show();
    self.renderTopContributors();
  },

  fetchData: function (self) {
    $.ajax({
      url: '/api/admin/agency/'+ this.agencyId + '/activities',
      dataType: 'json',
      success: function (activityData) {
        self.renderActivities(self, activityData);
      }.bind(this),
    });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAgenciesView;