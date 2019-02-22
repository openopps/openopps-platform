const $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');

var experience = {
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

  getDataFromAddExperiencePage:function (){
    var startDateValue = $('#start-month').val() + '-01-' + $('#start-year').val();
    var endDateValue = $('#end-month').val() + '-01-' + $('#end-year').val();
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
      postalCode: $('#postal-code').val(),
      cityName: $('#city').val(),
      formalTitle: $('#job-title').val(),
      isPresent: $('#Present').is(':checked'),
      duties: $('#duties').val(),
      startDate: experience.isValidDate(startDate) ? startDate.toLocaleDateString() : null,
      endDate: experience.isValidDate(endDate) ? endDate.toLocaleDateString() : null,
    };
    if ($('#experience-id').length) {
      modelData.experienceId = $('#experience-id').val();
      modelData.updatedAt = $('#updated-at').val();
    }

    return modelData;
  },

  saveExperience: function () {
    var data = experience.getDataFromAddExperiencePage.bind(this)();
    if(!this.validateFields() && !experience.validateAddExperienceFields(data)) {
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
          console.log(index);
          console.log(this.data.experience[index]);  
          callback();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }
  },

  saveExperienceContinue: function () {
    var overseasExperienceTypes = [];
    $.each($('[name=overseas_experience_types]:checked'), function (){            
      overseasExperienceTypes.push($(this).val());
    });
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({
        applicationId: this.data.applicationId,
        currentStep: 2,
        hasOverseasExperience: $('[name=has_overseas_experience]').val(),
        overseasExperienceOther: $('[name=overseas_experience_other]').val(),
        overseasExperienceLength: $('[name=overseas_experience_length]').val(),
        hasSecurityClearance: $('[name=has_security_clearance]').val(),
        securityClearanceId: $('[name=security_clearance_id]').val(),
        overseasExperienceTypes: overseasExperienceTypes,
        securityClearanceIssuer: $('[name=security_clearance_issuer]').val(),
        hasVsfsExperience: $('[name=has_vsfs_experience]').val(),
        updatedAt: this.data.updatedAt,
      }),
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.renderProcessFlowTemplate({ currentStep: 2, selectedStep: 3 });        
      this.updateApplicationStep(3);
      window.scrollTo(0, 0);
    }.bind(this));
  },

  toggleAddExperience: function (e) {
    var data = { employerName: '' };
    var template = templates.applyAddExperience(data);
        
    this.$el.html(template);
    this.$el.localize();
    
    this.renderProcessFlowTemplate({ currentStep: 2, selectedStep: 2 });
    this.initializeCountriesSelect();
    window.scrollTo(0, 0);
  },

  toggleUpdateExperience: function (e) {
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
    
    this.renderProcessFlowTemplate({ currentStep: 2, selectedStep: 2 });
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
    var data = { };
    
    var template = templates.applyExperience(this.data);
    
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: 2, selectedStep: 2 });
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
    } else {
      $('#end-month, #end-year')
        .prop('disabled', false)
        .addClass('validate');
    }
  },

  validateAddExperienceFields: function (data) {
    var abort = false;
    
    if (data.startDate != null && data.endDate != null) {
      var startDate = new Date(data.startDate);
      var endDate = new Date(data.endDate);

      if (startDate > endDate) {
        $('.error-datecomparison').show().closest('div').addClass('usa-input-error');
        abort = true;
      }
    }

    return abort;
  },

  formatExperienceDates: function (data) {
    var startDate = new Date(data.startDate);
    var endDate = new Date(data.endDate);
    if (experience.isValidDate(startDate)) {
      data.startMonth = '0' + (startDate.getMonth() + 1);
      data.startYear = startDate.getFullYear();
    } else {
      data.startMonth = '';
      data.startYear = '';
    }

    if (experience.isValidDate(endDate)) {
      data.endMonth = '0' + (endDate.getMonth() + 1);
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
};

module.exports = experience;