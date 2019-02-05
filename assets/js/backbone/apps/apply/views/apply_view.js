var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

// templates
var ApplyTemplate = require('../templates/apply_summary_template.html');
var ProcessFlowTemplate = require('../templates/process_flow_template.html');

var templates = {
  main: _.template(ApplyTemplate),
  processflow: _.template(ProcessFlowTemplate),
};

var ApplyView = Backbone.View.extend({

  events: {
    'blur .validate'                                              : 'validateField',
    'change .validate'                                            : 'validateField',
    'click .usajobs-drawer[data-id=exp-1] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=exp-2] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=ref-1] .usajobs-drawer-button' : 'toggleAccordion',
    'change [name=OverseasExperience]'                            : 'toggleOverseasExperienceDetails',
    'change [name=overseas-experience-filter]'                    : 'toggleOverseasExperienceFilterOther',
    'change [name=SecurityClearance]'                             : 'toggleSecurityClearanceDetails',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    this.$el.html(templates.main);
    $('#search-results-loading').hide();
    this.$el.localize();

    this.data = {
      accordion1: {
        open: false,
      },
      accordion2: {
        open: false,
      },
      accordion3: {
        open: false,
      },
    };

    // initialize sub components
    this.renderProcessFlowTemplate();
    this.toggleOverseasExperienceDetails();
    this.toggleOverseasExperienceFilterOther();
    this.toggleSecurityClearanceDetails();

    $('.apply-hide').hide();

    return this;
  },

  renderProcessFlowTemplate: function () {
    $('#process-title-banners').html(_.template(ProcessFlowTemplate)());
  },

  validateField: function (e) {
    return validate(e);
  },

  toggleAccordion: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion1.open = !this.data.accordion1.open;
    element.attr('aria-expanded', this.data.accordion1.open);
    element.siblings('.usajobs-drawer-content').attr('aria-hidden', !this.data.accordion1.open);

    this.data.accordion2.open = !this.data.accordion2.open;
    element.attr('aria-expanded', this.data.accordion2.open);
    element.siblings('.usajobs-drawer-content').attr('aria-hidden', !this.data.accordion2.open);

    this.data.accordion3.open = !this.data.accordion3.open;
    element.attr('aria-expanded', this.data.accordion3.open);
    element.siblings('.usajobs-drawer-content').attr('aria-hidden', !this.data.accordion3.open);
  },

  toggleOverseasExperienceDetails: function () {
    $('#overseas-experience-details').hide();

    if($('input#overseas-experience-yes').is(':checked')) {
      $('#overseas-experience-details').show();
    } else {
      $('#overseas-experience-details').hide();
    }
  },

  toggleOverseasExperienceFilterOther: function () {
    $('#overseas-experience-filter-other').hide();

    if($('input#overseasExperienceOther').is(':checked')) {
      $('#overseas-experience-filter-other').show();
    } else {
      $('#overseas-experience-filter-other').hide();
    }
  },

  toggleSecurityClearanceDetails: function () {
    $('#security-clearance-details').hide();

    if($('input#SecurityClearanceYes').is(':checked')) {
      $('#security-clearance-details').show();
    } else {
      $('#security-clearance-details').hide();
    }
  },

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },
});

module.exports = ApplyView;