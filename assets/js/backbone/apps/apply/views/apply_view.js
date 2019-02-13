var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');
var charcounter = require('../../../../vendor/jquery.charcounter');
var marked = require('marked');

// templates
var ApplyTemplate = require('../templates/apply_summary_template.html');
var ProcessFlowTemplate = require('../templates/process_flow_template.html');
var ApplyAddEducationTemplate = require('../templates/apply_add_education_template.html');
var ApplyEducationTemplate = require('../templates/apply_education_template.html');
var ApplyEducationPreviewTemplate = require('../templates/apply_education_preview_template.html');
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
  educationPreview:_.template(ApplyEducationPreviewTemplate),
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
    'click .apply-continue'                                       : 'applyContinue',
    'click .usajobs-drawer[data-id=exp-1] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=exp-2] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=ref-1] .usajobs-drawer-button' : 'toggleAccordion',

    //experience events
    'change [name=OverseasExperience]'                            : 'toggleOverseasExperienceDetails',
    'change [name=overseas-experience-filter]'                    : 'toggleOverseasExperienceFilterOther',
    'change [name=SecurityClearance]'                             : 'toggleSecurityClearanceDetails',

    //education events
    'click .usajobs-drawer[data-id=edu-1] .usajobs-drawer-button' : 'toggleAccordion',  
    'click #add-education'                                        : 'toggleAddEducation',
    'click #cancel-education'                                     : 'toggleAddEducationOff',
    'click #save-education'                                       : 'saveEducation',
    'click #delete-education'                                     : 'deleteEducation',
    'click #main-education-save'                                  : 'mainEducationSave',
    'change input[name=Enrolled]'                                 : 'changeCurrentlyEnrolled',
    'change input[name=Junior]'                                   : 'changeJunior',
    'change input[name=ContinueEducation]'                        : 'changeContinueEducation',

    //language events
    'click #add-language'                                         : 'toggleLanguagesOn',
    'click #cancel-language'                                      : 'toggleLanguagesOff',  
    'click #save-language'                                        : 'saveLanguage',

    //statement events
    'keypress #statement'                                         : 'statementCharacterCount',
    'keydown #statement'                                          : 'statementCharacterCount',

    //review events
    'click .apply-submit'                                         : 'submitApplication',
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
    this.data.statementOfInterestHtml = marked(this.data.statementOfInterest);
    this.data.firstChoice = _.findWhere(this.data.tasks, { sort_order: 1 });
    this.data.secondChoice = _.findWhere(this.data.tasks, { sort_order: 2 });
    this.data.thirdChoice = _.findWhere(this.data.tasks, { sort_order: 3 });
    this.params = new URLSearchParams(window.location.search);
    this.data.selectedStep = this.params.get('step') || this.data.currentStep;
    this.initializeComponentEducation(options);
    this.initializeEnumerations();
    this.initializeLanguages();
  },

  render: function () {
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
      case '6':
        this.$el.html(templates.applyReview(this.data));
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
    this.renderComponentEducation();
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
  initializeComponentEducation: function (options){
    this.dataEducationArray=[];
    this.dataEducation={};
  },

  renderComponentEducation: function (){
    //this.$el.html(templates.applyEducation);
    this.initializeCountriesSelect();
  },
  

  initializeFormFieldsEducation: function (){
    var data= this.dataEducation;
   
    $('input[name=Enrolled][value=' + data.isCurrentlyEnrolled +']').prop('checked', true);
    $('input[name=Junior][value=' + data.isMinimumCompleted +']').prop('checked', true);
    $('input[name=ContinueEducation][value=' + data.isEducationContinued +']').prop('checked', true);
    this.$('#cumulative-gpa').val(data.cumulativeGpa);
  },

  initializeCountriesSelect: function () {  
    
    $('#apply_country').select2({    
      placeholder: '- Select -',    
      minimumInputLength: 3,  
      ajax: {
        url: '/api/ac/country',
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

      formatNoMatches: 'No country found ',
    });

    $('#apply_country').on('change', function (e) {
      validate({ currentTarget: $('#apply_country') });
      this.countryCode = $('#apply_country').select2('data').code;
      this.countryCode && this.loadCountrySubivisionData();
    }.bind(this));

    $('#apply_country').focus();
  },

  loadCountrySubivisionData: function () {
    $.ajax({
      url: '/api/ac/countrySubdivision/' + this.countryCode,
      dataType: 'json',
    }).done(function (data) {
      this.initializeCountrySubdivisionSelect(data);
    }.bind(this));
  },

  getCompletedDateMonth:function (){
    var monthName = $('#completion-month').val(); 
   
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
      'August', 'September', 'October', 'November', 'December'];
    if( monthName.substring(0,1)=='0'){
      monthName= monthName.substring(1);
    }
    else{
      monthName;
    }
    return months[[monthName]-1]; 
  },

  initializeCountrySubdivisionSelect: function (data) {
    
    $('#apply_countrySubdivision').select2({
      placeholder: '- Select -',
      data: { results: data, text: 'value' },
      dropdownCssClass: 'select2-drop-modal',
      formatResult: function (item) {
        return item.value;
      },
      formatSelection: function (item) {
        return item.value;
      },
      formatNoMatches: 'No state found ',
    });
    if (data.length) {
      $('#apply_countrySubdivision').removeAttr('disabled', true);
      $('#apply_countrySubdivision').addClass('validate');
      
    } else {
      $('#apply_countrySubdivision').attr('disabled', true);
      $('#apply_countrySubdivision').removeClass('validate');
      $('.apply_countrySubdivision').removeClass('usa-input-error');
      $('.apply_countrySubdivision > .field-validation-error').hide();
    }
  
    $('#apply_countrySubdivision').on('change', function (e) {
      if ($('#apply_country').val() == 'United States') {
        validate({ currentTarget: $('#apply_countrySubdivision') });
      }  
    });
  },
  //Data for Add Education Page

  getDataFromAddEducationPage:function (){
    var modelData = {
      schoolName: $('#school-name').val(),
      countryId: $('#apply_country').val(),
      postalCode:$('#postal-code').val(),
      cityName: this.$('#city').val(),
      countrySubdivisionId: $('#apply_countrySubdivision').val(),
      degreeLevelId :$('#degree').val(),
      completionMonth: $('#completion-month').val(),
      completionYear: $('#completion-year').val(),
      major : $('#major').val(),
      minor: $('#minor').val(),
      gpa: $('#GPA').val(),
      gpaMax: $('#GPAMax').val(),
      totalCreditsEarned: $('#credit-earned').val(),
      creditSystem :$('[name=CreditSystem]:checked + label').text(),
      honorsId: $('#honors').val(),
      courseWork: $('#Coursework').val(),  
      honors: $('#honors :selected').text(),
      degreeLevel: $('#degree :selected').text(),
      country:$('#apply_country').select2('data')? $('#apply_country').select2('data').value: '',
      state:$('#apply_countrySubdivision').select2('data') ? $('#apply_countrySubdivision').select2('data').value: '',
      monthName:this.getCompletedDateMonth(),

    };
    return modelData;
  },

  getDataFromEducationPage:function (){
    var modelData = {
      isCurrentlyEnrolled:this.$('input[name=Enrolled]:checked').val(),
      isMinimumCompleted:this.$('input[name=Junior]:checked').val(),
      isEducationContinued: this.$('input[name=ContinueEducation]:checked').val(),
      cumulativeGpa: this.$('#cumulative-gpa').val(),
    };
    return modelData;
  },

  getHonors: function () {
    
    $.ajax({
      url: '/api/honors/' ,
      type: 'GET',
      async: false,
      success: function (data) {
        this.honors= data;
      
      }.bind(this),
    });
  },
  getDegreeLevels: function () {
    
    $.ajax({
      url: '/api/degreeLevels/' ,
      type: 'GET',
      async: false,
      success: function (data) {
        this.degreeLevels= data;
       
      }.bind(this),
    });
  },
  
  mainEducationSave:function (){
    var data= this.getDataFromEducationPage();
    // eslint-disable-next-line no-empty
    if(!this.validateEducationFields()){
      if(data.cumulativeGpa>=0 && data.cumulativeGpa<=2.99){
        alert('testing');
        this.$el.html(templates.applyIneligibleGPA);
      }
    }
  },

  saveEducation:function (){
    this.getCompletedDateMonth();
    var data= this.getDataFromAddEducationPage();   
    if(!this.validateFields())
    // eslint-disable-next-line no-empty
    {
     
      $.ajax({
        url: '/api/application/'+this.data.applicationId+'/Education',
        type: 'POST',
        data: data,
        success: function (education) {
          this.dataEducationArray.push(education);
          
          this.renderEducation();  
          this.toggleAddEducationOff();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }   
  },

  renderEducation: function (){   
    var  educationPreviewTemplate= _.template(ApplyEducationPreviewTemplate)({
      data:this.dataEducationArray,
    });
   
    $('#education-preview-id').html(educationPreviewTemplate);
  },

  deleteEducation:function (e){
    var educationId=$(e.currentTarget).attr('data-id');
    this.dataEducationArray = _.reject(this.dataEducationArray, function (el) {
      return el.educationId === educationId; 
    });
    $.ajax({
      url: '/api/application/'+ this.data.applicationId +'/Education/'+ educationId,
      type: 'Delete',     
      success: function (data) {       
        this.renderEducation(); 
      }.bind(this),
      error: function (err) {
       
      }.bind(this),
    });
   
    
  },
  changeCurrentlyEnrolled: function (){
    if($('[name=Enrolled]:checked').length>0){ 
      $('#apply-enrolled').removeClass('usa-input-error');    
      $('#apply-enrolled>.field-validation-error').hide();
      
    }
   
  },
  changeJunior:function (){
    if($('[name=Junior]:checked').length >0){ 
      $('#apply-junior').removeClass('usa-input-error');    
      $('#apply-junior>.field-validation-error').hide();   
    }
  },

  changeContinueEducation: function (){
    if($('[name=ContinueEducation]:checked').length>0){ 
      $('#apply-continue-education').removeClass('usa-input-error');    
      $('#apply-continue-education>.field-validation-error').hide();   
    }

  },

  validateFields: function () {
    var children = this.$el.find( '.validate' );
    var abort = false;

   
    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    
    return abort;
  },

  validateEducationFields: function () {
    var children = this.$el.find( '.validate' );
    var abort = false;

    if($('[name=ContinueEducation]:checked').length==0){ 
      $('#apply-continue-education').addClass('usa-input-error');    
      $('#apply-continue-education>.field-validation-error').show();
      abort=true;
    }

    if($('[name=Junior]:checked').length==0){ 
      $('#apply-junior').addClass('usa-input-error');    
      $('#apply-junior>.field-validation-error').show();
      abort=true;
    }

    if($('[name=Enrolled]:checked').length==0){ 
      $('#apply-enrolled').addClass('usa-input-error');    
      $('#apply-enrolled>.field-validation-error').show();
      abort=true;
    }

    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    
    return abort;
  },

  toggleAddEducation: function () { 
    var dataEducation= this.getDataFromEducationPage();
    this.dataEducation= dataEducation;
   
    this.getHonors();
    this.getDegreeLevels();  
    var data= {
      honors:this.honors,
      degreeLevels:this.degreeLevels,
    };   
    var template = _.template(ApplyAddEducationTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
  
    this.initializeCountriesSelect();
    
    setTimeout(function () {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, 50);
  },

  toggleAddEducationOff: function () { 
    this.$el.html(_.template(ApplyEducationTemplate)());
    this.initializeFormFieldsEducation();
    this.renderEducation();  
    setTimeout(function () {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, 50);
  },

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
  initializeLanguages: function () {
    this.data.languages = this.dataLanguageArray;
  },

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
    var data = {
      languageProficiencies: this.languageProficiencies,
    };

    var template = templates.applyAddLanguage(data);
    
    this.$el.html(template);
    this.$el.localize();

    this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });

    this.initializeLanguagesSelect();
    this.resetLanguages();
    window.scrollTo(0, 0);
  },

  toggleLanguagesOff: function (e) {
    var data = {
      languages: this.dataLanguageArray,
    };

    var template = templates.applyAddLanguage(data);

    this.$el.html(template);
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

  // statement section
  statementCharacterCount: function () {
    $('#statement').charCounter(2500, {
      container: '#statement-count',
    });
  },

  statementContinue: function () {
    this.data.currentStep = 6;
    this.data.selectedStep = 6;
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      data: {
        applicationId: this.data.applicationId,
        currentStep: 6,
        statementOfInterest: $('#statement').val(),
        updatedAt: this.data.updatedAt,
      },
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.data.statementOfInterest = result.statementOfInterest;
      this.data.statementOfInterestHtml = marked(this.data.statementOfInterest);
      this.$el.html(templates.applyReview(this.data));
      this.$el.localize();
      this.renderProcessFlowTemplate({ currentStep: 6, selectedStep: 6 });
      window.scrollTo(0, 0);
    }.bind(this));
  },
  // end statement section

  // review section
  submitApplication: function (e) {
    e.preventDefault && e.preventDefault();
    Backbone.history.navigate('apply/congratulations', { trigger: true, replace: true });
    window.scrollTo(0, 0);
  },
  // end review section

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },
});

module.exports = ApplyView;