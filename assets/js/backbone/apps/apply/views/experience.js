var $ = require('jquery');
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
    var modelData = {
      applicationId: this.data.applicationId,
      employerName: $('#employer-name').val(),
      addressLineOne: $('#street-address').val(),
      addressLineTwo: $('#street-address2').val(),
      countryId: $('#apply_country').val(),
      countrySubdivisionId: $('#apply_countrySubdivision').val(),
      postalCode: $('#postal-code').val(),
      cityName: $('#city').val(),
      formalTitle: $('#job-title').val(),
      isPresent: $('#present').is(':checked'),
      duties: $('#duties').val(),
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString(),
    };
    return modelData;
  },

  saveExperience: function () {
    if(!this.validateFields() && !experience.validateAddExperienceFields()) {
      var data = experience.getDataFromAddExperiencePage.bind(this)();
      var callback = experience.toggleExperienceOff.bind(this);
      console.log(data);
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/experience',
        type: 'POST',
        data: data,
        success: function (experience) {
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
      window.scrollTo(0, 0);
    }.bind(this));
  },

  toggleAddExperience: function (e) {
    var data = { };
    var template = templates.applyAddExperience(data);
        
    this.$el.html(template);
    this.$el.localize();
    
    this.renderProcessFlowTemplate({ currentStep: 2, selectedStep: 2 });
    this.initializeCountriesSelect();
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

  validateAddExperienceFields: function () {
    var abort = false;
    return abort;
  },
};

module.exports = experience;