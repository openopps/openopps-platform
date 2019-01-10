var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_template.html');
var CycleModel = require('../../../entities/cycles/cycle_model');
var ModalComponent = require('../../../components/modal');

var AdminCommunityCycleView = Backbone.View.extend({

  events: {
    'click #cycle-cancel': 'cancel',
    'click #cycle-save'  : 'save',
    'blur .validate'     : 'validateField',
    'change .validate'   : 'validateField',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      user: window.cache.currentUser,
      target: this.options.target,
    };
    this.community = {};
    this.cycle = new CycleModel();
    this.initializeListeners();
  },

  initializeListeners: function () {
    this.listenTo(this.cycle, 'cycle:save:success', function (data) {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'create-cycle',
        modalTitle: 'New cycle created',
        modalBody: 'The new cycle ' + data.name + ' has been successfully created.',
        primary: {
          text: 'Close',
          action: function () {
            this.modalComponent.cleanup();
            window.history.back();
          }.bind(this),
        },
        secondary: {},
      }).render();
    });
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
    this.loadCommunityData();
    return this;
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/' + this.options.target + '/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this[this.options.target] = targetInfo;
        this.renderTemplate();
      }.bind(this),
    });
  },

  loadCycleData: function () {

  },

  renderTemplate: function () {
    _.extend(this.data, {
      community: this.community,
      cycle: { },
    });

    var template = _.template(AdminCommunityCycleTemplate)(this.data);
    this.$el.html(template);
    this.rendered = true;
    // this.fetchData(this.data);
    this.data.target = this.options.target;
    $('#search-results-loading').hide();
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
      var data = {
        cycleId: this.cycle.get('cycleId'),
        communityId: this.community.communityId,
        name: $('#cycle-title').val(),
        postingStartDate: this.getDateFromFormGroup('first-day-date'),
        postingEndDate: this.getDateFromFormGroup('last-day-date'),
        applyStartDate: this.getDateFromFormGroup('start-application-date'),
        applyEndDate: this.getDateFromFormGroup('stop-application-date'),
        cycleStartDate: this.getDateFromFormGroup('start-internship-date'),
        cycleEndDate: this.getDateFromFormGroup('stop-internship-date'),
      };
      this.cycle.trigger('cycle:save', data);
    }
  },

  getDateFromFormGroup: function (formGroup) {
    return [
      $('#' + formGroup + '-1').val(),
      $('#' + formGroup + '-2').val(),
      $('#' + formGroup + '-3').val(),
    ].join('/');
  },

  validateField: function (e) {
    return validate(e);
  },

  validateFields: function () {
    var invalidDates = _.reduce([
      'first-day-date',
      'last-day-date',
      'start-application-date',
      'stop-application-date',
      'start-internship-date',
      'stop-internship-date',
    ], function (abort, dateGroup) {
      if(this.getDateFromFormGroup(dateGroup).match(/\d{2}\/\d{2}\/\d{4}/) && new Date(this.getDateFromFormGroup(dateGroup)) != 'Invalid Date') {
        $('#' + dateGroup).removeClass('usa-input-error');
        $('#' + dateGroup + ' input').removeClass('usa-input-inline-error usa-input-inline');
        $('#' + dateGroup + ' > .field-validation-error').hide();
        return abort || false;
      } else {
        $('#' + dateGroup).addClass('usa-input-error');
        $('#' + dateGroup + ' input').addClass('usa-input-inline-error usa-input-inline');
        $('#' + dateGroup + ' > .field-validation-error').show();
        return true;
      }
    }.bind(this), false);

    return _.reduce(this.$el.find('.validate'), function (abort, child) {
      return abort || validate({ currentTarget: child });
    }, invalidDates);

  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityCycleView;
