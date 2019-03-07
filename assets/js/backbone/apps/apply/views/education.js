var $ = require('jquery');
const templates = require('./templates');
const _ = require('underscore');
const Backbone = require('backbone');


function renderEducation (){ 
  var data= _.extend({data:this.data}, { completedMonthFunction: education.getCompletedDateMonth });
  $('#education-preview-id').html(templates.applyeducationPreview(data));
 
}
function toggleAddEducation () { 
  var dataEducation= getDataFromEducationPage();
  this.dataEducation= dataEducation;
  if(this.data.editEducation && this.data.currentStep ==3){
    var getEduStorage= localStorage.getItem('eduKey');
    this.dataEducation=JSON.parse(getEduStorage);
  }
 
  var data= {
    honors:this.honors,
    degreeLevels:this.degreeTypes,
  };   
  var template = templates.applyAddEducation(data);
  $('#search-results-loading').hide();
  this.$el.html(template); 

  initializeCountriesSelect.bind(this)();      
  setTimeout(function () {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }, 50);
}
  

function initializeFormFieldsEducation (){
  var data= this.dataEducation;
     
  $('input[name=Enrolled][value=' + data.isCurrentlyEnrolled +']').prop('checked', true);
  $('input[name=Junior][value=' + data.isMinimumCompleted +']').prop('checked', true);
  $('input[name=ContinueEducation][value=' + data.isEducationContinued +']').prop('checked', true);
  $('#cumulative-gpa').val(data.cumulativeGpa);
}

function getDataFromAddEducationPage (){
  var countryData = $('#apply_country').select2('data');
  var countrySubdivisionData=$('#apply_countrySubdivision').select2('data');
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
    honor: { lookupCodeId: $('#honors').val(), value: $('#honors :selected').text()},
    degreeLevel: { lookupCodeId: $('#degree').val(), value: $('#degree :selected').text()},
    country: countryData ,
    countrySubdivision:countrySubdivisionData,
  
  };
  return modelData;
}
function getDataFromEducationPage (){
  var modelData = {
    isCurrentlyEnrolled:this.$('input[name=Enrolled]:checked').val(),
    isMinimumCompleted:this.$('input[name=Junior]:checked').val(),
    isEducationContinued: this.$('input[name=ContinueEducation]:checked').val(),
    cumulativeGpa: this.$('#cumulative-gpa').val(),
  };
  return modelData;
}
function initializeCountriesSelect () { 
  if(this.data.editEducation) {
    var data= this.educationData;
    var country= data.country;
  }
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
    initSelection:function (element,callback){
      if(country){
        var data= {
          code: country.code,
          countryId: country.countryId,
          field: 'value',
          id: country.id,
          value: country.value, 
        };
        this.countryCode = country.code;
        loadCountrySubivisionData.bind(this)();
        callback(data);
      }
    }.bind(this),
  
  }).select2('val', []);
  
  
  $('#apply_country').on('change', function (e) {
    validate({ currentTarget: $('#apply_country') });
    this.countryCode = $('#apply_country').select2('data').code;
    this.countryCode && loadCountrySubivisionData.bind(this)();
  }.bind(this));
  
  $('#apply_country').focus();
}
  
function loadCountrySubivisionData () {
  $.ajax({
    url: '/api/ac/countrySubdivision/' + this.countryCode,
    dataType: 'json',
  }).done(function (data) {
    initializeCountrySubdivisionSelect.bind(this)(data);
  }.bind(this));
}

  
function initializeCountrySubdivisionSelect (data) {
      
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
}

function validateFields () {
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
}
  
var education = {

  initializeComponentEducation: function (options){
    this.dataEducationArray=[];
    this.dataEducation={};
    this.honors=[];
    this.degreeTypes=[];
    //this.initializeCountriesSelect();
  },
    
 
    
  initializeFormFieldsEducation: function (){
    var data= this.dataEducation;
       
    $('input[name=Enrolled][value=' + data.isCurrentlyEnrolled +']').prop('checked', true);
    $('input[name=Junior][value=' + data.isMinimumCompleted +']').prop('checked', true);
    $('input[name=ContinueEducation][value=' + data.isEducationContinued +']').prop('checked', true);
    $('#cumulative-gpa').val(data.cumulativeGpa);
  },
    
  toggleAddEducationOff: function () { 
    if(this.data.editEducation){
      Backbone.history.navigate(window.location.pathname + '?step=3',{trigger:false});
      this.data.editEducation='';
     
    }
    this.$el.html(templates.applyEducation(this.data));
    initializeFormFieldsEducation.bind(this)();
    renderEducation.bind(this)();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 3), selectedStep: 3 });
    window.scrollTo(0, 0);
  },
   
  saveEducation:function (){
 
    var data= getDataFromAddEducationPage(); 
    var callback= education.toggleAddEducationOff.bind(this); 
    if(!validateFields.bind(this)())
    // eslint-disable-next-line no-empty
    {
      if(this.data.editEducation){
        data.educationId=this.data.editEducation;
        data.updatedAt= this.educationData.updatedAt;      
      }
    
      $.ajax({
        url: '/api/application/'+this.data.applicationId+'/Education',
        type: 'PUT',
        data: data,
        success: function (education) {
       
          education.honor = data.honor;
          education.degreeLevel = data.degreeLevel;
          education.country= data.country;
          education.countrySubdivision=data.countrySubdivision;
          var index = _.findIndex(this.data.education, { educationId: education.educationId });
          if (index == -1) {
            this.data.education.push(education);
          } else {
            this.data.education[index] = education;
          }
          
          renderEducation.bind(this)();    
         
          callback();
          this.data.editEducation='';        
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }   
  },
  getCompletedDateMonth:function (month){
  
    var completionMonth= month.toString();
   
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 
      'August', 'September', 'October', 'November', 'December'];
    if( completionMonth.substring(0,1)=='0'){
      completionMonth= completionMonth.substring(1);
    }
    else{
      completionMonth;
    }
    return months[[completionMonth]-1]; 
  },
     
  initializeAddEducationFields:function (){   
    var data= this.educationData;  
    this.$('#school-name').val(data.schoolName);
    this.$('#postal-code').val(data.postalCode);
    this.$('#city').val(data.cityName);
    this.$('#completion-month').val(data.completionMonth);
    this.$('#completion-year').val(data.completionYear);
    this.$('#major').val(data.major);
    this.$('#minor').val(data.minor);
    this.$('#GPA').val(data.gpa);
    this.$('#GPAMax').val(data.gpaMax);
    this.$('#credit-earned').val(data.totalCreditsEarned);
    this.$('#Coursework').val(data.courseWork);
    this.$('#degree').val(data.degreeLevelId);
    this.$('#honors').val(data.honorsId);
    this.$('#apply_country').val(data.countryId);   
         
    this.$('input[name=CreditSystem][value="' + data.creditSystem + '"]').prop('checked', true);
    if(data.countrySubdivisionId) {
      $('#apply_countrySubdivision').val(data.countrySubdivisionId).trigger('change.select2');
    }
        
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
  
  getEducation: function (){
    //Backbone.history.navigate('/apply/'+this.data.applicationId+'?step=3&editEducation='+this.data.editEducation, { trigger: true, replace: true });
    $.ajax({
      url: '/api/application/'+ this.data.applicationId +'/Education/'+ this.data.editEducation,
      type: 'GET',
      async:false,
      success: function (data) {        
        this.educationData =data;              
        toggleAddEducation.bind(this)();   
        this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 3), selectedStep: 3 });  
      }.bind(this),
      error: function (err) {     
      }.bind(this),
    });
  },
 
  toggleAddEducation: function () { 
    var dataEducation= getDataFromEducationPage();
    this.dataEducation= dataEducation;
    //initializeCountriesSelect.bind(this)();  
    var data= {
      honors:this.honors,
      degreeLevels:this.degreeTypes,
    };   
    var template = templates.applyAddEducation(data);
    $('#search-results-loading').hide();
    this.$el.html(template); 
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 3), selectedStep: 3 });
    initializeCountriesSelect.bind(this)();      
    setTimeout(function () {
      document.body.scrollTop = 0; // For Safari
      document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    }, 50);
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
  educationContinue: function () {
    this.data.currentStep = Math.max(this.data.currentStep, 3);
    this.data.selectedStep = 4;
    var validationEduFields= education.validateEducationFields.bind(this); 
    if(!validationEduFields()){
      $.ajax({
        url: '/api/application/' + this.data.applicationId,
        method: 'PUT',
        data: {
          applicationId: this.data.applicationId,
          updatedAt: this.data.updatedAt,         
          isCurrentlyEnrolled:this.$('input[name=Enrolled]:checked').val()=='true' ? true : false,
          isMinimumCompleted:this.$('input[name=Junior]:checked').val()=='true' ? true : false,
          isEducationContinued: this.$('input[name=ContinueEducation]:checked').val()=='true' ? true : false,
          cumulativeGpa: this.$('#cumulative-gpa').val(),
        },
      }).done(function (result) {
        this.data.updatedAt = result.updatedAt;
        this.data.isCurrentlyEnrolled = result.isCurrentlyEnrolled;
        this.data.isMinimumCompleted = result.isMinimumCompleted;
        this.data.isEducationContinued=result.isEducationContinued;
        this.data.cumulativeGpa = result.cumulativeGpa;
        if(result.cumulativeGpa>=0 && result.cumulativeGpa<=2.99){       
          this.$el.html(templates.applyIneligibleGPA);
        }
        else{      
          this.updateApplicationStep(4);
        }      
        this.$el.localize();
       
        window.scrollTo(0, 0);
      }.bind(this));
    }
  },


};
module.exports = education;
