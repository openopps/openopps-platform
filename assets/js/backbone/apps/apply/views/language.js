var $ = require('jquery');

var language = {
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

  renderLanguages: function () {
    // var languageTemplate = _.template(InternshipLanguagePreviewTemplate)({
    //   data: this.dataLanguageArray,     
    // });
    // $('#lang-1').html(languageTemplate);
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
};

module.exports = language;