var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

// templates
var ApplyTemplate = require('../templates/apply_language_template.html');
var ProcessFlowTemplate = require('../templates/process_flow_template.html');
var ApplyAddEducationTemplate = require('../templates/apply_add_education_template.html');
var ApplyEducationTemplate = require('../templates/apply_education_template.html');
var ApplyAddExperienceTemplate = require('../templates/apply_add_experience_template.html');
var ApplyExperienceTemplate = require('../templates/apply_experience_template.html');
var ApplyAddLanguageTemplate = require('../templates/apply_add_language_template.html');
var ApplyLanguageTemplate = require('../templates/apply_language_template.html');
var ApplyAddReferenceTemplate = require('../templates/apply_add_reference_template.html');
var ApplyAddSkillTemplate = require('../templates/apply_add_skill_template.html');
var ApplyIneligibleCitizenshipTemplate = require('../templates/apply_ineligible_citizenship_template.html');
var ApplyIneligibleGPATemplate = require('../templates/apply_ineligible_gpa_template.html');
var ApplyProgramTemplate = require('../templates/apply_program_template.html');
var ApplyReviewTemplate = require('../templates/apply_review_template.html');
var ApplyStatementTemplate = require('../templates/apply_statement_template.html');
var ApplySummaryTemplate = require('../templates/apply_summary_template.html');

var templates = {
  main: _.template(ApplyTemplate),
  processflow: _.template(ProcessFlowTemplate),
  applyAddEducation: _.template(ApplyAddEducationTemplate),
  applyEducation: _.template(ApplyEducationTemplate),
  applyAddExperience: _.template(ApplyAddExperienceTemplate),
  applyExperience: _.template(ApplyExperienceTemplate),
  applyAddLanguage: _.template(ApplyAddLanguageTemplate),
  applyLanguage: _.template(ApplyLanguageTemplate),
  applyAddReference: _.template(ApplyAddReferenceTemplate),
  applyAddSkill: _.template(ApplyAddSkillTemplate),
  applyIneligibleCitizenship: _.template(ApplyIneligibleCitizenshipTemplate),
  applyIneligibleGPA: _.template(ApplyIneligibleGPATemplate),
  applyProgram: _.template(ApplyProgramTemplate),
  applyReview: _.template(ApplyReviewTemplate),
  applyStatement: _.template(ApplyStatementTemplate),
  applySummary: _.template(ApplySummaryTemplate),
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

  // initialize components and global functions
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

    this.renderProcessFlowTemplate();
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
  // end initialize components and global functions
 
  // process flow section 
  renderProcessFlowTemplate: function () {
    $('#process-title-banners').html(_.template(ProcessFlowTemplate)());
  },
  // end process flow section

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