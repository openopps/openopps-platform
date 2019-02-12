const _ = require('underscore');
const async = require('async');
const Backbone = require('backbone');
const $ = require('jquery');
const templates = require('./templates');

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
    'click .apply-continue'                                       : 'applyContinue',
  },

  // initialize components and global functions
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.data = _.extend(this.data, {
      accordion1: { open: false },
      accordion2: { open: false },
      accordion3: { open: false },
      firstChoice: _.findWhere(this.data.tasks, { sort_order: 1 }),
      secondChoice: _.findWhere(this.data.tasks, { sort_order: 2 }),
      thirdChoice: _.findWhere(this.data.tasks, { sort_order: 3 }),
    });
    this.params = new URLSearchParams(window.location.search);
    this.data.selectedStep = this.params.get('step') || this.data.currentStep;
  },

  render: function () {
    this.$el.html(templates.getTemplateForStep(this.data.selectedStep)(this.data));
    $('#search-results-loading').hide();
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
    this.toggleOverseasExperienceDetails();
    this.toggleOverseasExperienceFilterOther();
    this.toggleSecurityClearanceDetails();

    $('.apply-hide').hide();

    return this;
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

  applyContinue: function (e) {
    e.preventDefault && e.preventDefault();
    this[e.currentTarget.dataset.action] && this[e.currentTarget.dataset.action]();
  },
  // end initialize components and global functions
 
  // process flow section 
  renderProcessFlowTemplate: function (data) {
    $('#process-title-banners').html(templates.processflow(data));
  },
  // end process flow section

  // summary section
  summaryContinue: function () {
    $.ajax({
      url: '/api/application/' + this.data.applicationId + '/import',
      method: 'POST',
      data: {
        applicationId: this.data.applicationId,
      },
    }).done(function () {
      this.updateApplicationStep(1);
    }.bind(this)).fail(function (err) {
      if (err.status == 404) {
        // TODO: display failed to import profile modal
        this.updateApplicationStep(1);
      } else {
        showWhoopsPage();
      }
    }.bind(this));
  },

  updateApplicationStep: function (step) {
    this.data.currentStep = step;
    this.data.selectedStep = step;
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      data: {
        applicationId: this.data.applicationId,
        currentStep: this.data.currentStep,
        updatedAt: this.data.updatedAt,
      },
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.$el.html(templates.getTemplateForStep(this.data.selectedStep)(this.data));
      this.$el.localize();
      this.renderProcessFlowTemplate({ currentStep: step, selectedStep: step });
      window.scrollTo(0, 0);
    }.bind(this)).fail(function () {
      showWhoopsPage();
    });
  },
  // end summary section

  // education section
  // end education section

  // experience section
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
  // end experience section

  // language section
  // end language section

  // reference section
  // end reference section

  // skill section
  // end skill section

  // program section
  // end program section

  // review section
  // end review section

  // statement section
  // end statement section

  // summary section
  // end summary sectrion

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },
});

module.exports = ApplyView;