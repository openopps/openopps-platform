var $ = require('jquery');

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
};

module.exports = experience;