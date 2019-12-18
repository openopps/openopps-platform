var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_form_template.html');
var CycleModel = require('../../../entities/cycles/cycle_model');
var ModalComponent = require('../../../components/modal');

var AdminCommunityCycleEditView = Backbone.View.extend({

  events: {
    'click #cycle-cancel'             : 'cancel',
    'click #cycle-save'               : 'save',
    'blur #secondary-application-url' : 'displayDate',
    'blur .validate'                  : 'validateField',
    'change .validate'                : 'validateField',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      user: window.cache.currentUser,
      community: this.options.community,
      cycle: this.options.cycle || {},
    };
    this.cycle = new CycleModel(this.data.cycle);
    this.initializeListeners();
    
  },

  initializeListeners: function () {
    this.listenTo(this.cycle, 'cycle:save:success', function (cycle) {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'create-cycle',
        modalTitle: (this.data.cycle.cycleId ? 'Cycle updated' : 'New cycle created'),
        modalBody: 'The cycle <b>' + cycle.get('name') + '</b> has been successfully ' + (this.data.cycle.cycleId ? 'updated.' : 'created.'),
        primary: {
          text: 'Close',
          action: function () {
            this.modalComponent.cleanup();
            window.history.back();
          }.bind(this),
        },
        secondary: {},
      }).render();
    }.bind(this));
    this.listenTo(this.cycle, 'cycle:save:error', function (model, response, options) {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'create-cycle',
        alert: 'error',
        primary: null,
        modalTitle: 'An error has occurred',
        modalBody: response.responseText,
      }).render();
    });
  },

  render: function (replace) {
    this.$el.show();
    var template = _.template(AdminCommunityCycleTemplate)(this.data);
    this.$el.html(template);
    if (this.data.cycle.secondaryApplicationUrl) {
      this.$('#exclusive-end-date').show();
    }
    return this;
  },

  displayDate: function(e) {
    e.preventDefault && e.preventDefault(); 
    var link = e.currentTarget.value;
    if((link).length > 0) {
      $('#exclusive-end-date').show();
    } else {
      $('#exclusive-end-date-1').val('');
      $('#exclusive-end-date-2').val('');
      $('#exclusive-end-date-3').val('');
      this.data.cycle.exclusivePostingEndDate = null;
      $('#exclusive-end-date').hide(); 
    }
  },

  cancel: function (e) {
    e.preventDefault && e.preventDefault();
    window.history.back();
  },

  save: function (e) {
    e.preventDefault && e.preventDefault();    
    if(this.validateFields()) {
      $('.usa-input-error').get(0).scrollIntoView();
    } else {
      var abort=false;
      var data = {
        cycleId: this.cycle.get('cycleId'),
        communityId: this.data.community.communityId,
        name: $('#cycle-title').val(),
        postingStartDate: this.getDateFromFormGroup('first-day-date'),
        postingEndDate: this.getDateFromFormGroup('last-day-date'),
        applyStartDate: this.getDateFromFormGroup('start-application-date'),
        applyEndDate: this.getDateFromFormGroup('stop-application-date'),
        reviewStartDate: this.getDateFromFormGroup('start-review-date'),
        reviewEndDate: this.getDateFromFormGroup('end-review-date'),
        cycleStartDate: this.getDateFromFormGroup('start-internship-date'),
        cycleEndDate: this.getDateFromFormGroup('stop-internship-date'),
        secondaryApplicationUrl: $('#secondary-application-url').val(),
        exclusivePostingEndDate: this.getExclusiveDate('exclusive-end-date'),
        updatedAt: this.cycle.get('updatedAt'),
      };
      if(new Date(data.postingEndDate)>new Date(data.applyEndDate)){ 
        $('#last-day-date').addClass('usa-input-error');  
        $('#last-day-date>.exceed-date-error').show(); 
        abort=true; 
      }
      else{
        $('#last-day-date').removeClass('usa-input-error');  
        $('#last-day-date>.exceed-date-error').hide(); 
      }
      if(new Date(data.applyEndDate)>new Date(data.reviewStartDate)){
        $('#stop-application-date').addClass('usa-input-error');  
        $('#stop-application-date>.exceed-date-error').show(); 
        abort=true;
      }
      else{
        $('#stop-application-date').removeClass('usa-input-error');  
        $('#stop-application-date>.exceed-date-error').hide(); 
      }
      if(new Date(data.reviewEndDate)>new Date(data.cycleStartDate)){
        $('#end-review-date').addClass('usa-input-error');  
        $('#end-review-date>.exceed-date-error').show(); 
        abort=true;      
      }
      else{
        $('#end-review-date').removeClass('usa-input-error');  
        $('#end-review-date>.exceed-date-error').hide(); 
      }
      if(($('#secondary-application-url').val().length > 0) && (this.validDateGroup('exclusive-end-date') === false)) {
        //require exclusive date
        $('#exclusive-end-date').addClass('usa-input-error');  
        $('#exclusive-end-date>.require-error-date').show(); 
        abort=true;
      } else {
        $('#exclusive-end-date').removeClass('usa-input-error');  
        $('#exclusive-end-date>.require-error-date').hide(); 
      }

      if(!abort){
        this.cycle.trigger('cycle:save', data);
      }
      else{
        $('.usa-input-error').get(0).scrollIntoView();
      }
    }
  },
 
  getDateFromFormGroup: function (formGroup) {
    return [
      $('#' + formGroup + '-1').val(),
      $('#' + formGroup + '-2').val(),
      $('#' + formGroup + '-3').val(),
    ].join('/');
  },

  getExclusiveDate: function (formGroup) {
    var dateValue = this.getDateFromFormGroup(formGroup);
    if(dateValue === '//') {
      return '';
    }
    return dateValue;
  },

  validateField: function (e) {
    return validate(e);
  },

  validDateGroup: function (dateGroup) {
    var dateValue = this.getDateFromFormGroup(dateGroup);
    if(dateValue.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[1-2][0-9]|3[01])\/([2]\d{3}|\d{2})$/)) {
      $('#' + dateGroup).removeClass('usa-input-error');
      $('#' + dateGroup + ' input').removeClass('usa-input-inline-error usa-input-inline');
      $('#' + dateGroup + ' > .error-date').hide();
      return true;
    } else {
      $('#' + dateGroup).addClass('usa-input-error');
      $('#' + dateGroup + ' input').addClass('usa-input-inline-error usa-input-inline');
      $('#' + dateGroup + ' > .error-date').show();
      return false;
    }
  },

  validDateRange: function (dateRange) {
    var validDates = _.reduce(dateRange, function (valid, dateGroup) {
      return this.validDateGroup(dateGroup) && valid;
    }.bind(this), true);
    if(validDates) {
      var startDate = new Date(this.getDateFromFormGroup(dateRange[0]));    
      var endDate = new Date(this.getDateFromFormGroup(dateRange[1]));
      if(startDate < endDate) {
        _.each(dateRange, function (dateGroup) {
          $('#' + dateGroup).removeClass('usa-input-error');
          $('#' + dateGroup + ' input').removeClass('usa-input-inline-error usa-input-inline');
          $('#' + dateGroup + ' > .error-date-range').hide();
        });
        return true;
      } else {
        _.each(dateRange, function (dateGroup) {
          $('#' + dateGroup).addClass('usa-input-error');
          $('#' + dateGroup + ' input').addClass('usa-input-inline-error usa-input-inline');
          $('#' + dateGroup + ' > .error-date-range').show();
        });
        return false;
      }
    } else {
      return false;
    }
  },

  validateFields: function () {
    var invalidDates = _.reduce([
      ['first-day-date', 'last-day-date'],
      ['start-application-date', 'stop-application-date'],
      ['start-review-date', 'end-review-date'],
      ['start-internship-date', 'stop-internship-date'],
    ], function (abort, dateRange) {
      return !this.validDateRange(dateRange) || abort;
    }.bind(this), false);

    return _.reduce(this.$el.find('.validate'), function (abort, child) {
      return validate({ currentTarget: child }) || abort;
    }, invalidDates);

  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityCycleEditView;
