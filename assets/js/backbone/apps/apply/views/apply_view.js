var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

// templates
var ApplyTemplate = require('../templates/apply_summary_template.html');
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
    'click #add-language'                                         : 'toggleLanguagesOn',
    'click #cancel-language'                                      : 'toggleLanguagesOff',  
    'click #save-language'                                        : 'saveLanguage',
    'click .apply-continue'                                       : 'applyContinue',
  },

  // initialize components and global functions
  initialize: function (options) {
    this.options              = options;
    this.data                 = options.data;
    this.dataLanguageArray    = [];
    this.deleteLanguageArray  = [];
    this.data.firstChoice     = _.findWhere(this.data.tasks, { sort_order: 1 });
    this.data.secondChoice    = _.findWhere(this.data.tasks, { sort_order: 2 });
    this.data.thirdChoice     = _.findWhere(this.data.tasks, { sort_order: 3 });
    this.params               = new URLSearchParams(window.location.search);
    this.data.selectedStep    = this.params.get('step') || this.data.currentStep;
    this.languageProficiencies = [];
  },

  render: function () {
    this.initializeEnumerations();

    switch (this.data.selectedStep.toString()) {
      case '1':
        this.$el.html(templates.applyProgram(this.data));
        break;
      case '2':
        this.$el.html(templates.applyExperience(this.data));
        break;
      case '3':
        this.$el.html(templates.applyEducation(this.data));
        break;
      case '4':
        this.$el.html(templates.applyLanguage(this.data));
        break;
      case '5':
        this.$el.html(templates.applyStatement(this.data));
        break;
      default:
        this.$el.html(templates.main);
        break;
    }
    $('#search-results-loading').hide();
    this.$el.localize();

    this.data = _.extend(this.data, {
      accordion1: {
        open: false,
      },
      accordion2: {
        open: false,
      },
      accordion3: {
        open: false,
      },
    });

    
    this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
    this.toggleOverseasExperienceDetails();
    this.toggleOverseasExperienceFilterOther();
    this.toggleSecurityClearanceDetails();

    $('.apply-hide').hide();

    return this;
  },

  initializeEnumerations: function () {
    $.ajax({
      url: '/api/lookup/application/enumerations',
      type: 'GET',
      async: false,
      success: function (data) {
        this.languageProficiencies = data.languageProficiencies;
      }.bind(this),
    });
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
    $('#process-title-banners').html(_.template(ProcessFlowTemplate)(data));
  },
  // end process flow section

  // summary section
  summaryContinue: function () {
    this.data.currentStep = 1;
    this.data.selectedStep = 1;
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      data: {
        applicationId: this.data.applicationId,
        currentStep: 1,
        updatedAt: this.data.updatedAt,
      },
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.$el.html(templates.applyProgram(this.data));
      this.$el.localize();
      this.renderProcessFlowTemplate({ currentStep: 1, selectedStep: 1 });
      window.scrollTo(0, 0);
    }.bind(this));
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
  initializeLanguagesSelect: function () {
    $('#languageId').select2({
      placeholder: '- Select -',
      minimumInputLength: 3,
      ajax: {
        url: '/api/ac/languages',
        dataType: 'json',
        data: function (term) {       
          return { q: term };
        },
        results: function (data) {         
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

    $('#languageId').on('change', function (e) {
      validate({ currentTarget: $('#languageId') });
      if($('#languageId').val() !=''){
        $('span#lang-id-val.field-validation-error').hide();
        $('#language-select').removeClass('usa-input-error');   
      }
    }.bind(this));
    $('#languageId').focus();
  },

  deleteLanguage: function (e){
    var dataAttr=$(e.currentTarget).attr('data-id');
    this.deleteLanguageArray.push(this.dataLanguageArray[dataAttr]);      
    var updateArray= _.difference(this.dataLanguageArray,this.deleteLanguageArray);   
    this.dataLanguageArray= updateArray;
    this.renderLanguages(); 
  },

  validateLanguage:function (e){
    var abort=false;   
    
    if($('#languageId').val() ==''){
      $('#language-select').addClass('usa-input-error'); 
      $('span#lang-id-val.field-validation-error').show();
      abort=true;
    }
    else{
      $('span#lang-id-val.field-validation-error').hide(); 
    }

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    return abort; 
  },
  
  getDataFromLanguagePage: function (){
    var modelData = {
      languageId:$('#languageId').val(),
      readSkillLevel:$('[name=read-skill-level]:checked + label').text(), 
      readingProficiencyId:$('[name=read-skill-level]:checked').val(), 
      selectLanguage:$('#languageId').select2('data').value,      
      speakingProficiencyId:$('[name=spoken-skill-level]:checked').val(),
      spokenSkillLevel:$('[name=spoken-skill-level]:checked + label').text(),
      writingProficiencyId:$('[name=written-skill-level]:checked').val(),
      writtenSkillLevel:$('[name=written-skill-level]:checked + label').text(),
    };
    return modelData;
  },

  saveLanguage:function (){
    $('.usajobs-alert--error').hide();
    if(!this.validateLanguage()){
      var language = this.getDataFromLanguagePage();
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/language',
        method: 'POST',
        contentType: 'application/json',
        data: {
          applicationId: this.data.applicationId,
          language: language,
          updatedAt: this.data.updatedAt,
        },
      }).done(function (result) {
        this.dataLanguageArray.push(result.language);
        this.data.updatedAt = result.updatedAt;
        this.$el.html(templates.applyLanguage(this.data));
        this.$el.localize();
        this.renderProcessFlowTemplate({ currentStep: 1, selectedStep: 1 });
        window.scrollTo(0, 0);
      }.bind(this)).fail(function (err) {
        if(err.statusCode == 400) {
          showWhoopsPage();
        } else {
          $('.usajobs-alert--error').show();
          window.scrollTo(0,0);
        }
      });
    }  
  },
  
  resetLanguages:function (e){
    $('#languageId').select2('data', null);  
    $("input[name='spoken-skill-level'][id='spoken-none']").prop('checked', true);
    $("input[name='written-skill-level'][id='written-none']").prop('checked', true);
    $("input[name='read-skill-level'][id='read-none']").prop('checked', true);
  },

  toggleLanguagesOn: function (e) {
    templates.applyAddLanguage({
      data: this.dataLanguageArray,     
    });
    
    this.$el.html(templates.applyAddLanguage);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });
    this.initializeLanguagesSelect();
    this.resetLanguages();
    window.scrollTo(0, 0);
  },

  toggleLanguagesOff: function (e) {
    templates.applyLanguage({
      data: this.dataLanguageArray,     
    });
    this.$el.html(templates.applyLanguage);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });
    window.scrollTo(0, 0);
  },
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