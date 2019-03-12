var $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');

function initializeLanguagesSelect (language) {
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

    initSelection: function (element, callback){
      if(!(_.isEmpty(language))) {
        var data = {
          languageId: language.languageId,
          field: 'value',
          id: language.languageId,
          value: language.details.value, 
        };
        callback(data);
      }
    }.bind(this),

  }).select2('val', []);
  
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

function getSelectedLangauge (id, languages) {
  return languages.find(function (l) { return l.applicationLanguageSkillId == id; });
}

var language = {
  saveLanguage: function (e) {
    $('.usajobs-alert--error').hide();
    var action = $(e.currentTarget).data('action');
    var id = $(e.currentTarget).data('id');
    var data = {};
    var method = action === 'edit' ? 'PUT' : 'POST';
    if(!validateLanguage.bind(this)()) {
      data.applicationId = this.data.applicationId;
      data.languageId = $('#languageId').val();
      data.readingProficiencyId = $('[name=read-skill-level]:checked').val();
      data.speakingProficiencyId = $('[name=speaking-skill-level]:checked').val();
      data.writingProficiencyId = $('[name=written-skill-level]:checked').val();
      if (action === 'edit') {
        data.applicationLanguageSkillId = id;
      } 
      $.ajax({
        url: '/api/application/' + this.data.applicationId + '/language',
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(data),
      }).done(function (result) {
        this.data.language = result;
        this.updateApplicationStep(4);
      }.bind(this)).fail(function (err) {
        if(err.statusCode == 400) {
          showWhoopsPage();
        } else {
          $('.usajobs-alert--error').show();
          window.scrollTo(0,0);
        }
      }.bind(this));
    }  
  },

  saveLanguageContinue: function () {
    this.data.currentStep = Math.max(this.data.currentStep, 4);
    this.data.selectedStep = 5;
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      data: {
        applicationId: this.data.applicationId,
        updatedAt: this.data.updatedAt,
      },
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.$el.localize();
      this.updateApplicationStep(5);      
      window.scrollTo(0, 0);
    }.bind(this));
  },

  toggleLanguagesOn: function (e) {
    var action = $(e.currentTarget).data('action');
    var id = $(e.currentTarget).data('id');
    var data = {
      languageProficiencies: this.languageProficiencies,
      language: (action == 'edit' ? getSelectedLangauge(id, this.data.language) : []),
      action: action,
      id: id,
    };

    var template = templates.applyAddLanguage(data);
        
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 4), selectedStep: 4 });
    
    initializeLanguagesSelect(data.language);

    if (action != 'edit') {
      resetLanguages();
    } 

    window.scrollTo(0, 0);
  },
    
  toggleLanguagesOff: function (e) {
    var data = {
      language: this.data.language,
    };
    
    var template = templates.applyLanguage(data);
    
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 4), selectedStep: 4 });
    window.scrollTo(0, 0);
  },
};

module.exports = language;