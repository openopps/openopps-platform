var $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');

function initializeLanguagesSelect () {
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
}

function resetLanguages (e) {
  $('#languageId').select2('data', null);  
  $("input[name='speaking-skill-level'][id='speaking-none']").prop('checked', true);
  $("input[name='written-skill-level'][id='written-none']").prop('checked', true);
  $("input[name='read-skill-level'][id='read-none']").prop('checked', true);
}

function validateLanguage (e) {
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
}

function getDataFromLanguagePage () {
  var modelData = {
    languageId:$('#languageId').val(),
    // readSkillLevel:$('[name=read-skill-level]:checked + label').text(), 
    readingProficiencyId:$('[name=read-skill-level]:checked').val(), 
    // selectLanguage:$('#languageId').select2('data').value,      
    speakingProficiencyId:$('[name=speaking-skill-level]:checked').val(),
    // speakingSkillLevel:$('[name=speaking-skill-level]:checked + label').text(),
    writingProficiencyId:$('[name=written-skill-level]:checked').val(),
    // writtenSkillLevel:$('[name=written-skill-level]:checked + label').text(),
  };
  return modelData;
}

var language = {
  deleteLanguage: function (e) {
    var dataAttr=$(e.currentTarget).attr('data-id');
    this.deleteLanguageArray.push(this.dataLanguageArray[dataAttr]);      
    var updateArray= _.difference(this.dataLanguageArray,this.deleteLanguageArray);   
    this.dataLanguageArray= updateArray;
    renderLanguages(); 
  },
    
  saveLanguage: function () {
    $('.usajobs-alert--error').hide();
    var data = getDataFromLanguagePage();
    this.dataLanguageArray.push(data);
    if(!validateLanguage()) {
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/language',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          applicationId: this.data.applicationId,
          language: this.dataLanguageArray,
          updatedAt: this.data.updatedAt,
        }),
      }).done(function (result) {
        this.dataLanguageArray.push(result.language);
        this.data.updatedAt = result.updatedAt;
        this.$el.html(templates.applyLanguage(this.data));
        this.$el.localize();
        this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });
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

  saveLanguageContinue: function () {
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({
        applicationId: this.data.applicationId,
        currentStep: 4,
        updatedAt: this.data.updatedAt,
      }),
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 5 });
      window.scrollTo(0, 0);
    }.bind(this));
  },

  renderLanguages: function () {
    // var languageTemplate = _.template(InternshipLanguagePreviewTemplate)({
    //   data: this.dataLanguageArray,     
    // });
    // $('#lang-1').html(languageTemplate);
  },
          
  toggleLanguagesOn: function (e) {
    var data = {
      languageProficiencies: this.languageProficiencies,
    };
    
    var template = templates.applyAddLanguage(data);
        
    this.$el.html(template);
    this.$el.localize();
    
    this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });
    
    initializeLanguagesSelect();
    resetLanguages();
    window.scrollTo(0, 0);
  },
    
  toggleLanguagesOff: function (e) {
    var data = {
      languages: this.dataLanguageArray,
    };
    
    var template = templates.applyLanguage(data);
    
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: 4, selectedStep: 4 });
    window.scrollTo(0, 0);
  },
};

module.exports = language;