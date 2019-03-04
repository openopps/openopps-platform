/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require('underscore');
const Backbone = require('backbone');
const $ = require('jquery');
const charcounter = require('../../../../vendor/jquery.charcounter');
const marked = require('marked');
const templates = require('./templates');
const nextSteps = require('./next_steps');

//utility functions
var Program = require('./program');
var Experience = require('./experience');
var Language = require('./language');
var Education = require('./education');
var Statement = require('./statement');
var ModalComponent = require('../../../components/modal');

var ApplyView = Backbone.View.extend({
  events: {
    'blur .validate'                                              : 'validateField',
    'change .validate'                                            : 'validateField',
    'click .apply-continue'                                       : 'applyContinue',
    'click .usajobs-drawer-button'                                : 'toggleDrawers',
    'click #back'                                                 : 'backClicked',

    //process flow events
    'click .usajobs-progress_indicator__body a'                   : 'historyApplicationStep',

    //program events
    'click .program-delete'                                       : function (e) { this.callMethod(Program.deleteProgram, e); },
    'click .sorting-arrow'                                        : function (e) { this.callMethod(Program.moveProgram, e); },

    //experience events
    'change [name=has_overseas_experience]'                       : function () { this.callMethod(Experience.toggleOverseasExperienceDetails); },
    'change [name=overseas_experience_types]'                     : function () { this.callMethod(Experience.toggleOverseasExperienceFilterOther); },
    'change [name=has_security_clearance]'                        : function () { this.callMethod(Experience.toggleSecurityClearanceDetails); },
    'click #saveExperienceContinue'                               : function () { this.callMethod(Experience.saveExperienceContinue); },
    'click #add-experience'                                       : function () { this.callMethod(Experience.toggleAddExperience); },
    'click #edit-experience'                                      : function (e) { this.callMethod(Experience.toggleUpdateExperience, e); },
    'click .cancel-add-experience-reference'                      : function () { this.callMethod(Experience.toggleExperienceOff); },
    'click #save-add-experience'                                  : function () { this.callMethod(Experience.saveExperience); },
    'click #save-update-experience'                               : function () { this.callMethod(Experience.updateExperience); },
    'click #Present'                                              : function () { this.callMethod(Experience.toggleEndDate); },
    'click #add-reference'                                        : function () { this.callMethod(Experience.toggleAddReference); },
    'click #edit-reference'                                       : function (e) { this.callMethod(Experience.toggleUpdateReference, e); },
    'click #save-add-reference'                                   : function () { this.callMethod(Experience.saveReference); },
    'click #save-update-reference'                                : function () { this.callMethod(Experience.updateReference); },
    'click .delete-record'                                        : 'deleteRecord',

    //education events
    'click #add-education'                                        : function () { this.callMethod(Education.toggleAddEducation); },
    'click #cancel-education'                                     : function () { this.callMethod(Education.toggleAddEducationOff); },
    'click #save-education'                                       : function () { this.callMethod(Education.saveEducation); },
    'click #education-edit'                                       : 'editEducation',
    'click #saveEducationContinue'                                : function () { this.callMethod(Education.educationContinue); },
    'change input[name=Enrolled]'                                 : function () { this.callMethod(Education.changeCurrentlyEnrolled); },
    'change input[name=Junior]'                                   : function () { this.callMethod(Education.changeJunior); },
    'change input[name=ContinueEducation]'                        : function () { this.callMethod(Education.changeContinueEducation); },

    //language events
    'click #add-language'                                         : function () { this.callMethod(Language.toggleLanguagesOn); },
    'click #cancel-language'                                      : function () { this.callMethod(Language.toggleLanguagesOff); },  
    'click #save-language'                                        : function () { this.callMethod(Language.saveLanguage); },
    'click #edit-language'                                        : function () { this.callMethod(Language.deleteLanguage); },
    
    //statement events
    'keypress #statement'                                         : function () { this.callMethod(Statement.characterCount); },
    'keydown #statement'                                          : function () { this.callMethod(Statement.characterCount); },
    'click #statementContinue'                                    : function () { this.callMethod(Statement.statementContinue); },

    //review events
    'click .usajobs-profile-home-section__sub-edit'               : 'historyApplicationStep',
    'click .apply-submit'                                         : 'submitApplication',
  },

  // initialize components and global functions
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.data = _.extend(this.data, {
      firstChoice: _.findWhere(this.data.tasks, { sortOrder: 1 }),
      secondChoice: _.findWhere(this.data.tasks, { sortOrder: 2 }),
      thirdChoice: _.findWhere(this.data.tasks, { sortOrder: 3 }),
      statementOfInterestHtml: marked(this.data.statementOfInterest),
    });
    // this.dataLanguageArray     = [];
    // this.deleteLanguageArray   = [];
    // this.data.languages        = this.data.languages || [];
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
    Experience.renderExperienceComponent.bind(this)();
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
        this.data.securityClearances= data.securityClearances;
        this.referenceTypes={};
        for (var i=0;i<data.referenceTypes.length;i++) {
          this.referenceTypes[data.referenceTypes[i].code] = data.referenceTypes[i];
        }
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

  callMethod: function (method, e) {
    method.bind(this)(e);
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
    this.data.currentStep = Math.max(this.data.currentStep, step);
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
      if (this.data.selectedStep == '3' || this.data.selectedStep == '6') {
        this.renderEducation();
      }
      this.renderProcessFlowTemplate({ currentStep: this.data.currentStep, selectedStep: this.data.selectedStep });
      window.scrollTo(0, 0);
    }.bind(this)).fail(function () {
      showWhoopsPage();
    });
  },

  historyApplicationStep: function (e) {
    step = e.currentTarget.dataset.step;
    this.data.selectedStep = step;
    Backbone.history.navigate(window.location.pathname + '?step=' + step, { trigger: false });
    this.render();
    window.scrollTo(0, 0);
  },
  // end summary section

  // education section
  renderComponentEducation: function (){
    this.renderEducation();
    if(this.data.editEducation && this.data.selectedStep =='3'){
      Education.getEducation.bind(this)();
      Education.initializeAddEducationFields.bind(this)();
    }
  },
  
  editEducation:function (e){
    var educationId= $(e.currentTarget).attr('data-id');
    var dataEducation= Education.getDataFromEducationPage.bind(this)();
    localStorage.setItem('eduKey', JSON.stringify(dataEducation));
    Backbone.history.navigate('/apply/'+this.data.applicationId+'?step=3&editEducation='+educationId, { trigger: true, replace: true });  
    return this;       
  },

  renderEducation:function (){   
    var data= _.extend({data:this.data.education}, { completedMonthFunction: Education.getCompletedDateMonth.bind(this) });
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

  deleteRecord: function (e) {
    var recordData = $(e.currentTarget).data(),
        applicationData = this.data;
  
    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'delete-record',
      modalTitle: 'Delete ' + recordData.section,
      modalBody: 'Are you sure you want to delete ' + recordData.name + '?',
      primary: {
        text: 'Delete',
        action: function () {
          $.ajax({
            url: '/api/application/'+ applicationData.applicationId +'/' + recordData.section + '/'+ recordData.id,
            type: 'Delete',     
            success: function (data) {
              var recordList = [];
              _.each(applicationData[recordData.section], function (element) {
                if (element[recordData.section + '_id'] != recordData.id) {
                  recordList.push(element);
                }
              });
              applicationData[recordData.section] = recordList;
              $(e.currentTarget).closest('li').remove();
              this.modalComponent.cleanup();
            
            }.bind(this),
            error: function (err) {
              this.modalComponent.cleanup();
            }.bind(this),
          });
        }.bind(this),
      },
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
    }).render();
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
});

module.exports = ApplyView;