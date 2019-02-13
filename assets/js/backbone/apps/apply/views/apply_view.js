const _ = require('underscore');
const Backbone = require('backbone');
const $ = require('jquery');
const marked = require('marked');
const templates = require('./templates');
const nextSteps = require('./next_steps');

//utility functions
var Experience = require('./experience');
var Language = require('./language');

var ApplyView = Backbone.View.extend({
  events: {
    'blur .validate'                                              : 'validateField',
    'change .validate'                                            : 'validateField',
    'click .apply-continue'                                       : 'applyContinue',
    'click .usajobs-drawer[data-id=exp-1] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=exp-2] .usajobs-drawer-button' : 'toggleAccordion',
    'click .usajobs-drawer[data-id=ref-1] .usajobs-drawer-button' : 'toggleAccordion',

    //experience events
    'change [name=has_overseas_experience]'                       : function () { this.callMethod(Experience.toggleOverseasExperienceDetails); },
    'change [name=overseas_experience_types]'                     : function () { this.callMethod(Experience.toggleOverseasExperienceFilterOther); },
    'change [name=has_security_clearance]'                        : function () { this.callMethod(Experience.toggleSecurityClearanceDetails); },
    'click #saveExperienceContinue'                               : function () { this.callMethod(Experience.saveExperienceContinue); },

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
    'click #add-language'                                         : function () { this.callMethod(Language.toggleLanguagesOn); },
    'click #cancel-language'                                      : function () { this.callMethod(Language.toggleLanguagesOff); },  
    'click #save-language'                                        : function () { this.callMethod(Language.saveLanguage); },

    //statement events
    'keypress #statement'                                         : 'statementCharacterCount',
    'keydown #statement'                                          : 'statementCharacterCount',

    //review events
    'click .apply-submit'                                         : 'submitApplication',
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
      statementOfInterestHtml: marked(this.data.statementOfInterest),
    });
    this.dataLanguageArray     = [];
    this.deleteLanguageArray   = [];
    this.data.languages        = this.data.languages || [];
    this.languageProficiencies = [];
    this.params = new URLSearchParams(window.location.search);
    this.data.selectedStep = this.params.get('step') || this.data.currentStep;
    this.initializeComponentEducation(options);
    this.initializeEnumerations();
  },

  render: function () {
    this.$el.html(templates.getTemplateForStep(this.data.selectedStep)(this.data));
    $('#search-results-loading').hide();
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
    this.renderComponentEducation();
    Experience.toggleOverseasExperienceDetails();
    Experience.toggleOverseasExperienceFilterOther();
    Experience.toggleSecurityClearanceDetails();
    // Language.renderLanguages();
    Language.initializeLanguagesSelect();

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

  callMethod: function (method) {
    method.bind(this)();
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
    // TODO: Only run if current step equals 0
    nextSteps.importProfileData.bind(this)();
  },

  updateApplicationStep: function (step) {
    this.data.currentStep = (this.data.currentStep < step ? step : this.data.currentStep);
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
      Backbone.history.navigate(window.location.pathname + '?step=' + step, { trigger: false });
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

  // language section
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