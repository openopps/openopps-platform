/* eslint-disable no-empty */
const $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');

var experience = {
  characterCount: function () {
    $('#experience-other').charCounter(250, {
      container: '#other-count',
    });
    $('#overseas-total-length').charCounter(250, {
      container: '#overseas-count',
    });
    $('#duties').charCounter(5000, {
      container: '#duties-accomplish',
    });
  },

  toggleWorkExperience: function () {
    if ($('#experience-id').length < 1) {
      $('#check-experience-details').css('display', 'block');
      if($('input#check-experience').is(':checked')) {
        $('#add-experience').attr('disabled','disabled');
      } else {
        $("input[name='checkExperience']:checkbox").prop('checked', false);
        $('#add-experience').removeAttr('disabled');
      }
    } else {
      $('#check-experience-details').css('display', 'none');
    }
    $('#check-experienceQn').removeClass('usa-input-error');    
    $('#check-experienceQn .field-validation-error').hide();
  },
  
  toggleOverseasExperienceDetails: function () {
    $('#overseas-experience-details').hide();
    $('#overseas-experienceQn').removeClass('usa-input-error');    
    $('#overseas-experienceQn .field-validation-error').hide();
    $('#overseas-experience-details').removeClass('usa-input-error');    
    $('#overseas-experience-details>.field-validation-error').hide();
    if($('input#overseas-experience-yes').is(':checked')) {
      $('#overseas-experience-details').show();
      $('#overseas-total-length-exp').show();
      $('#overseas-total-length').addClass('validate');
      
    } else {
      $('#overseas-experience-details').hide();
      $("input[name='overseas_experience_types']:checkbox").prop('checked', false);
      $('#overseas-experience-filter-other').hide();
      $('[name=overseas_experience_other]').val('');
      $('[name=overseas_experience_length]').val('');
      $('#overseas-experience-details').hide();
      $('#overseas-total-length-exp').hide();
      $('#overseas-total-length').removeClass('validate');
      $('#experience-other').removeClass('validate');
    }
  },

  toggleOverseasExperienceFilterOther: function () {
    $('#overseas-experience-filter-other').hide();
    if ($("[name='overseas_experience_types']:checked").length>0){     
      $('#overseas-experience-details').removeClass('usa-input-error'); 
      $('#overseas-experienceQn').removeClass('usa-input-error');      
      $('#overseas-experience-details>.field-validation-error').hide();  
    }
    if($('input#overseasExperienceOther').is(':checked')) {
      $('#overseas-experience-filter-other').show();
      $('#overseas-experienceQn').removeClass('usa-input-error'); 
      $('#experience-other').addClass('validate');    
    } else {
      $('#overseas-experience-filter-other').hide();      
        
      $('[name=overseas_experience_other]').val(''); 
      $('#experience-other').removeClass('validate');      
    }
  },

  toggleVsfsDetails: function (){
    if($('[name=has_vsfs_experience]:checked').length>0){ 
      $('#vsfs_experienceQn').removeClass('usa-input-error');    
      $('#vsfs_experienceQn>.field-validation-error').hide();
    }
  },
  
  toggleSecurityClearanceDetails: function () {
    $('#security-clearance-details').hide();
    $('#security_clearenceQn').removeClass('usa-input-error');    
    $('#security_clearenceQn .field-validation-error').hide();
    if($('input#SecurityClearanceYes').is(':checked')) {   
      $('#security-clearance-details').show();      
      $('#security-clearance-issuer').addClass('validate');    
      $('#security-clearance-type').addClass('validate');
    } 
    else {
      $('#security-clearance-details').hide();
      $('#security-clearance-type').prop('selectedIndex', 0);
      $('#security-clearance-issuer').val('');
      $('#security-clearance-issuer').removeClass('validate');    
      $('#security-clearance-type').removeClass('validate');
    }
  },

  getDataFromAddExperiencePage:function (){
    var startDateValue = $('#start-month').val() + '/01/' + $('#start-year').val();
    var endDateValue = $('#end-month').val() + '/01/' + $('#end-year').val();  
    var startDate = new Date(startDateValue);
    var endDate = new Date(endDateValue);  
    var countryData = $('#apply_country').select2('data');
    var countrySubdivisionData = $('#apply_countrySubdivision').select2('data');
    var modelData = {
      applicationId: this.data.applicationId,
      employerName: $('#employer-name').val(),
      addressLineOne: $('#street-address').val(),
      addressLineTwo: $('#street-address2').val(),
      country: countryData,
      countrySubdivision: countrySubdivisionData,
      postalCode: $('#postal-code').val() || '',
      cityName: $('#city').val(),
      formalTitle: $('#job-title').val(),
      isPresent: $('#Present').is(':checked'),
      duties: $('#duties').val(),
      startDate: experience.isValidDate(startDate) ? startDate.toISOString() : null,
      endDate: experience.isValidDate(endDate) ? endDate.toISOString() : null,
    };
    if ($('#experience-id').length) {
      modelData.experienceId = $('#experience-id').val();
      modelData.updatedAt = $('#updated-at').val();
      $('#check-experience-details').css('display', 'none');  
      $('#add-experience').removeAttr('disabled');
    } else {
      $('#check-experience-details').css('display', 'block');
    }

    return modelData;
  },

  getDataFromExperiencePage: function () {
    var overseasExperienceTypes = [];
    $.each($('[name=overseas_experience_types]:checked'), function (){            
      overseasExperienceTypes.push($(this).val());
    });
    return {
      applicationId: this.data.applicationId,
      currentStep: Math.max(this.data.currentStep, 2),
      hasOverseasExperience: $('input[name=has_overseas_experience]:checked').val(),
      overseasExperienceOther: $('[name=overseas_experience_other]').val(),
      overseasExperienceLength: $('[name=overseas_experience_length]').val(),
      hasSecurityClearance: $('input[name=has_security_clearance]:checked').val(),
      securityClearanceId: $('#security-clearance-type').val(),
      overseasExperienceTypes: overseasExperienceTypes,
      securityClearanceIssuer: $('[name=security_clearance_issuer]').val(),
      hasVsfsExperience: $('input[name=has_vsfs_experience]:checked').val(),
      updatedAt: this.data.updatedAt,
    };
  },

  updateExperienceDataObject: function () {
    var data = experience.getDataFromExperiencePage.bind(this)();
    this.data.hasOverseasExperience = data.hasOverseasExperience;
    this.data.overseasExperienceOther = data.overseasExperienceOther;
    this.data.overseasExperienceLength = data.overseasExperienceLength;
    this.data.hasSecurityClearance = data.hasSecurityClearance;
    this.data.securityClearanceId = data.securityClearanceId;
    this.data.overseasExperienceTypes = data.overseasExperienceTypes;
    this.data.securityClearanceIssuer = data.securityClearanceIssuer;
    this.data.hasVsfsExperience = data.hasVsfsExperience;
  },

  saveExperience: function () {
    var data = experience.getDataFromAddExperiencePage.bind(this)();   
    var experienceValidation=experience.validateAddExperienceFields(data);
    this.data.declineExperience = false;
    if(!this.validateFields() && !experienceValidation) {
      var callback = experience.toggleExperienceOff.bind(this);
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/experience',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (experience) {      
          if (this.data.experience && $.isArray(this.data.experience)) {
            this.data.experience.push(experience);
          } else {
            this.data.experience = [experience];
          }
          callback();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }  
  },

  updateExperience: function () {
    var data = experience.getDataFromAddExperiencePage.bind(this)();
    if(!this.validateFields() && !experience.validateAddExperienceFields(data)) {
      var callback = experience.toggleExperienceOff.bind(this);
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/experience/' + data.experienceId,
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (experience) {
          var index = _.findIndex(this.data.experience, { experienceId: experience.experienceId });
          this.data.experience[index] = experience;
          callback();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    } 
  },

  validateExperience:function (){
  
    var children = this.$el.find( '.validate' );
    var abort = false;

    if($('li[data-section=experience]').length < 1 && !$('input#check-experience').is(':checked')) {
      $('#check-experienceQn').addClass('usa-input-error');    
      $('#check-experienceQn .field-validation-error').show();
      abort = true;
    } else {
      $('#check-experienceQn').removeClass('usa-input-error');    
      $('#check-experienceQn .field-validation-error').hide();
    }

    if($('[name=has_overseas_experience]:checked').length==0){ 
      $('#overseas-experienceQn').addClass('usa-input-error');    
      $('#overseas-experienceQn .field-validation-error').show();
      abort = true;
    }
    
    if($('[name=has_overseas_experience]:checked').length>0){ 
      if($('input#overseas-experience-yes').is(':checked')) {
        if ($("[name='overseas_experience_types']:checked").length==0){     
          $('#overseas-experience-details').addClass('usa-input-error');    
          $('#overseas-experience-details>.field-validation-error').show();
          abort = true;
        }
      }
      else{
        $('#overseas-experienceQn').removeClass('usa-input-error');    
        $('#overseas-experienceQn .field-validation-error').hide();
        $('#overseas-experience-details').removeClass('usa-input-error');    
        $('#overseas-experience-details>.field-validation-error').hide();
      }     
    }

    if($('[name=has_security_clearance]:checked').length==0){ 
      $('#security_clearenceQn').addClass('usa-input-error');    
      $('#security_clearenceQn .field-validation-error').show();
      abort = true;
    }

    if($('[name=has_vsfs_experience]:checked').length==0){ 
      $('#vsfs_experienceQn').addClass('usa-input-error');    
      $('#vsfs_experienceQn>.field-validation-error').show();
      abort = true;
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


  saveExperienceContinue: function () {
    var validateExperience= experience.validateExperience.bind(this);
    var data = experience.getDataFromExperiencePage.bind(this)();
    this.data.currentStep = Math.max(this.data.currentStep, 2);
    this.data.selectedStep = 3; 
    data.declineExperience = $('input#check-experience').is(':checked'); 
    if(!validateExperience()){
      $.ajax({
        url: '/api/application/' + this.data.applicationId,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data),
      }).done(function (result) {
        this.data.updatedAt = result.updatedAt;       
        this.updateApplicationStep(3);
        window.scrollTo(0, 0);
      }.bind(this));  
    } 
  },

  toggleAddExperience: function (e) { 
    experience.updateExperienceDataObject.bind(this)();
    var data = { employerName: '' };
    var template = templates.applyAddExperience(data);
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 2), selectedStep: 2 });
    this.initializeCountriesSelect();
    window.scrollTo(0, 0);
  },

  toggleUpdateExperience: function (e) {
    experience.updateExperienceDataObject.bind(this)();
    var data = {};
    var id = $(e.currentTarget).data('id');
    $.each(this.data.experience, function (i, experience) {
      if (experience.experienceId == id) {
        data = experience;
      }
    });
    data = experience.formatExperienceDates(data);
    var template = templates.applyAddExperience(data);
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 2), selectedStep: 2 });
    this.initializeCountriesSelect();
    $('#apply_country').select2('data', { 
      id: data.country.countryId, 
      code: data.country.code, 
      value: data.country.value, 
      field: 'value',
      countryId: data.country.countryId, 
    });
    $('#apply_country').trigger('change');
    experience.toggleEndDate();
    window.scrollTo(0, 0);
  },

  toggleExperienceOff: function (e) {
    this.$el.html(templates.applyExperience(this.data)); 
    experience.characterCount.bind(this)(); 
    experience.renderExperienceComponent.bind(this)();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 2), selectedStep: 2 });
    if (this.data.experience.length < 1 ) {
      $('#check-experience-details').css('display', 'block');
    } else {
      $('#check-experience-details').css('display', 'none');
    }
    window.scrollTo(0, 0);
  },

  toggleEndDate: function () {
    if ($('#Present').is(':checked')) {     
      $('#end-month, #end-year')
        .val('')
        .prop('disabled', true)
        .removeClass('validate')
        .closest('.usa-input-error')
        .removeClass('usa-input-error')
        .find('span.field-validation-error').hide();
      $('#end-date-section> .field-validation-error').hide();
     
    } else {
      $('#end-month, #end-year')
        .prop('disabled', false)
        .addClass('validate');
    }
  },

  renderExperienceComponent: function () {
    experience.toggleOverseasExperienceDetails.bind(this)();
    experience.toggleOverseasExperienceFilterOther.bind(this)();
    experience.toggleSecurityClearanceDetails.bind(this)();
  },

  validateAddExperienceFields: function (data) {
    var abort = false;
    
    if (data.startDate != null && data.endDate != null) {
      var startDate = new Date(data.startDate);
      var endDate = new Date(data.endDate);
      
      if (startDate > endDate && !data.isPresent ) {
        $('.error-datecomparison').show().closest('div').addClass('usa-input-error');
        abort = true;
      }
      else{
        $('#end-date-section>.field-validation-error').hide();       
        abort = false;
      }
    }

    return abort;
  },

  postalCodeDisable: function () {
    // var country = $('#apply_country').select2('data');
    if (this.countryCode == 'US') {
      $('#postal-code')
        .attr('data-validate', 'empty,count100,html')
        .removeAttr('disabled')
        .addClass('validate')
        .parent().addClass('required-input');
    } else {
      $('#postal-code')
        .attr('value', '')
        .removeAttr('data-validate')
        .prop('disabled', true)
        .removeClass('validate')
        .closest('.required-input').removeClass('required-input usa-input-error');
      $('.error-empty').css('display', 'none');
      $('.error-count100').css('display', 'none');
      $('.error-html').css('display', 'none');
    }
  },

  formatExperienceDates: function (data) {
    var startDate = new Date(moment((data.startDate || '').split('T')[0]).format('YYYY/MM/DD'));
    var endDate = new Date(moment((data.endDate || '').split('T')[0]).format('YYYY/MM/DD'));
    if (experience.isValidDate(startDate)) {       
      var startDateMonthStr=  (startDate.getMonth()+ 1).toString();     
      if(startDateMonthStr.length<2) {
        data.startMonth = '0' + (startDate.getMonth() + 1); 
      }
      else{
        data.startMonth = startDate.getMonth() + 1; 
      }       
      data.startYear = startDate.getFullYear();
    } else {
      data.startMonth = '';
      data.startYear = '';
    }

    if (experience.isValidDate(endDate)) {
      var endDateMonthStr=  (endDate.getMonth()+ 1).toString(); 
      if(endDateMonthStr.length<2){
        data.endMonth = '0' + (endDate.getMonth() + 1); 
      } 
      else{
        data.endMonth =  (endDate.getMonth() + 1); 
      } 
      data.endYear = endDate.getFullYear();
    } else {
      data.endMonth = '';
      data.endYear = '';
    }

    return data;
  },

  isValidDate: function (date) {
    return date instanceof Date && !isNaN(date);
  },

  toggleAddReference: function () {
    experience.updateExperienceDataObject.bind(this)();
    var data = { referenceTypes: this.referenceTypes };   
    var template = templates.applyAddReference(data);
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 2), selectedStep: 2 });
    window.scrollTo(0, 0);
  },

  toggleUpdateReference: function (e) {
    experience.updateExperienceDataObject.bind(this)();
    var data = {};
    var id = $(e.currentTarget).data('id');
    $.each(this.data.reference, function (i, reference) {
      if (reference.referenceId == id) {
        data = reference;
      }
    });
    data.referenceTypes = this.referenceTypes;
    var template = templates.applyAddReference(data);
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 2), selectedStep: 2 });
    window.scrollTo(0, 0);
  },

  getDataFromAddReferencePage: function () {
    var modelData = {
      referenceName: $('#name').val(),
      referencePhone: $('#telephone').val(),
      referenceEmail: $('#email').val(),
      referenceEmployer: $('#employer').val(),
      referenceTitle: $('#reference_title').val(),
      isReferenceContact: $('#contact-yes').is(':checked'),
      referenceTypeId: $('[name=ReferenceType]:checked').val(),
      referenceTypeName: $('[name=ReferenceType]:checked').data('name'),
    };
    if ($('#reference-id').length) {
      modelData.referenceId = $('#reference-id').val();
      modelData.updatedAt = $('#updated-at').val();
    }
    return modelData;
  },
  
  saveReference: function () {
    var data = experience.getDataFromAddReferencePage.bind(this)();
    if(!this.validateFields()) {
      var callback = experience.toggleExperienceOff.bind(this);
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/reference',
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (reference) {
          reference.referenceType = { value: data.referenceTypeName };
          if (this.data.reference && $.isArray(this.data.reference)) {
            this.data.reference.push(reference);
          } else {
            this.data.reference = [reference];
          }
          callback();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }
  },

  updateReference: function () {
    var data = experience.getDataFromAddReferencePage.bind(this)();
    if(!this.validateFields()) {
      var callback = experience.toggleExperienceOff.bind(this);
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/reference/' + data.referenceId,
        type: 'PUT',
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function (reference) {
          reference.referenceType = { value: data.referenceTypeName };
          var index = _.findIndex(this.data.reference, { referenceId: reference.referenceId });
          this.data.reference[index] = reference;
          callback();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }
  },
};

module.exports = experience;