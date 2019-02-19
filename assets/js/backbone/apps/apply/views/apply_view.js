/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require('underscore');
const Backbone = require('backbone');
const $ = require('jquery');
const charcounter = require('../../../../vendor/jquery.charcounter');
const marked = require('marked');
const templates = require('./templates');
const nextSteps = require('./next_steps');

//utility functions
var Experience = require('./experience');
var Language = require('./language');
var Education = require('./education');
var Statement = require('./statement');


var ApplyView = Backbone.View.extend({
  events: {
    'blur .validate'                                              : 'validateField',
    'change .validate'                                            : 'validateField',
    'click .apply-continue'                                       : 'applyContinue',
    'click .usajobs-drawer-button'                                : 'toggleDrawers',
    'click #back'                                                 : 'backClicked',
    'click .program-delete'                                       : 'deleteProgram',

    //experience events
    'change [name=has_overseas_experience]'                       : function () { this.callMethod(Experience.toggleOverseasExperienceDetails); },
    'change [name=overseas_experience_types]'                     : function () { this.callMethod(Experience.toggleOverseasExperienceFilterOther); },
    'change [name=has_security_clearance]'                        : function () { this.callMethod(Experience.toggleSecurityClearanceDetails); },
    'click #saveExperienceContinue'                               : function () { this.callMethod(Experience.saveExperienceContinue); },
    'click #add-experience'                                       : function () { this.callMethod(Experience.toggleAddExperience); },
    'click #cancel-add-experience'                                : function () { this.callMethod(Experience.toggleExperienceOff); },
    'click #save-add-experience'                                  : function () { this.callMethod(Experience.saveExperience); },

    //education events
    'click #add-education'                                        : function () { this.callMethod(Education.toggleAddEducation); },
    'click #cancel-education'                                     : function () { this.callMethod(Education.toggleAddEducationOff); },
    'click #save-education'                                       : function () { this.callMethod(Education.saveEducation); },
    'click #delete-education'                                     : 'deleteEducation',
    'click #education-edit'                                       : 'editEducation',
    'click #saveEducationContinue'                                : function () { this.callMethod(Education.educationContinue); },


    //language events
    'click #add-language'                                         : function () { this.callMethod(Language.toggleLanguagesOn); },
    'click #cancel-language'                                      : function () { this.callMethod(Language.toggleLanguagesOff); },  
    'click #save-language'                                        : function () { this.callMethod(Language.saveLanguage); },

    //statement events
    'keypress #statement'                                         : function () { this.callMethod(Statement.statementCharacterCount); },
    'keydown #statement'                                          : function () { this.callMethod(Statement.statementCharacterCount); },
    'click #statementContinue'                                    : function () { this.callMethod(Statement.statementContinue); },
    'click #statementCancel'                                      : function () { this.callMethod(Statement.cancel); },

    //review events
    'click .apply-submit'                                         : 'submitApplication',
  },

  // initialize components and global functions
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.data = _.extend(this.data, {
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
    this.templates = templates;
	  this.data.editEducation= this.params.get('editEducation');
    Education.initializeComponentEducation.bind(this)();
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
    Statement.characterCount();

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
        this.honors=data.academicHonors;
        this.degreeTypes=data.degreeTypes;
			
      }.bind(this),
    });
  },

  validateField: function (e) {
    return validate(e);
  },

  backClicked: function () {
    this.data.selectedStep--;
    Backbone.history.navigate(window.location.pathname + '?step=' + this.data.selectedStep, { trigger: false });
    this.$el.html(templates.getTemplateForStep(this.data.selectedStep)(this.data));
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
  },

  callMethod: function (method) {
    method.bind(this)();
  },

  deleteProgram: function (e) {
    e.preventDefault && e.preventDefault();
    $.ajax({
      url: '/api/application/' + this.data.applicationId + '/task/' + e.currentTarget.dataset.taskId,
      method: 'DELETE',
    }).done(function () {
      this.data.tasks.splice(e.currentTarget.dataset.index, 1);
      this.data[['firstChoice', 'secondChoice', 'thirdChoice'][e.currentTarget.dataset.index]] = null;
      this.$el.html(templates.getTemplateForStep(1)(this.data));
    }.bind(this)).fail(function () {
      showWhoopsPage();
    });
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

  toggleDrawers: function (e) {
    var element = $(e.currentTarget);
    var target = element.siblings('.usajobs-drawer-content');
    var open = element.attr('aria-expanded') == 'true';
    if (!open) {
      target.slideDown('fast', function () {
        $('html, body').animate({
          scrollTop: element.offset().top,
        });
        element.attr('aria-expanded', 'true');
        target.attr('aria-hidden', 'false');
      });
    } else {
      target.slideUp(function () {
        element.attr('aria-expanded', 'false');
        target.attr('aria-hidden', 'true');
      });
    }
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
      this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
      window.scrollTo(0, 0);
    }.bind(this)).fail(function () {
      showWhoopsPage();
    });
  },
  // end summary section

  // education section
  
  renderComponentEducation: function (){
    
    if(this.data.editEducation && this.data.selectedStep =='3'){
      
      Education.getEducation.bind(this)();
     
      Education.initializeAddEducationFields.bind(this)();
      
    }
    else if(this.data.selectedStep =='3'){
      this.$el.html(templates.applyEducation(this.data));   
      this.renderProcessFlowTemplate({ currentStep: 3, selectedStep: 3 });   
    }    
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
  editEducation:function (e){
    var educationId= $(e.currentTarget).attr('data-id');
    // console.log(this);
    this.dataEducationArray = _.filter(this.dataEducationArray, function (el) {
      return el.educationId === educationId; 
    });
    var data = _.reduce( this.dataEducationArray, function ( e,item) {
      return _.extend( e, item ); }, {} );
   
    Backbone.history.navigate('/apply/'+data.applicationId+'?step=3&editEducation='+educationId, { trigger: true, replace: true });
    return this;       
  },

  renderEducation:function (){ 
    var data= {
      data:this.dataEducationArray,
    }; 
    $('#education-preview-id').html(templates.applyeducationPreview(data));
  },
  
  // end education section
  
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