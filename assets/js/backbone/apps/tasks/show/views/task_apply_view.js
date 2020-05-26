var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Bootstrap = require('bootstrap');
var Backbone = require('backbone');
var BaseView = require('../../../../base/base_view');
var UIConfig = require('../../../../config/ui.json');

var TaskApplyTemplate = require('../templates/task_apply_template.html');
var TaskResumeTemplate = require('../templates/task_apply_resume_template.html');
var TaskApplyNextTempalte = require('../templates/task_apply_next_template.html');


var TaskApplyView = BaseView.extend({
  events: {
    'click #accept-toggle'            : 'toggleAccept', 
    'click #submit'                   : 'submitVolunteer',
    'blur .validate'                  : 'validateField',
    'change .validate'                : 'validateField',
    'keypress #statement'             : 'characterCount',
    'keydown #statement'              : 'characterCount',
    'change input[name=resumes]'      : 'changeResume', 
    'click #cancel'                   : 'cancel',  
    'click #upload-resume'            : 'upload',
    'click #refresh-resumes'          : 'refresh' ,
    'click .download-resume'          : 'downloadResume',
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.edit= this.params.get('edit');
    this.resumes=[];
    this.volunteer={};
    this.task={};
    this.render();
    $('#search-results-loading').hide();
  },

  render: function () {
    this.getResumes();   
    if(this.edit){
      this.loadApplicant();    
    }
    else{
      var compiledTemplate = _.template(TaskApplyTemplate)({statementOfInterest:''});   
      this.$el.html(compiledTemplate);
    }
    this.characterCount();
    this.renderResumes();
    this.$el.localize();
    $('#search-results-loading').hide();
  },

  loadApplicant : function (){
    var taskId= this.options.data.taskId;
    var volunteerId= this.params.get('edit');  
    $.ajax({
      url: '/api/volunteer/' + volunteerId +'?' + $.param({
        taskId:taskId,
      }),  
      type: 'GET',
      async: false,
      success: function (data) {    
        this.volunteer=data;
        this.$el.html(_.template(TaskApplyTemplate)(data));
      }.bind(this),
    });
  },

  getTaskCommunityInfo: function () {
    var taskId = this.options.data.taskId;
    $.ajax({
      url: '/api/task/' + taskId + '?' + $.param({
        taskId: taskId,
      }),
      type: 'GET',
      async: false,
      success: function (data) {
        this.task = data;
      }.bind(this),
    });
  },
  
  getResumes: function () {   
    $.ajax({
      url: '/api/volunteer/user/resumes' ,
      type: 'GET',
      async: false,
      success: function (data) {
        this.key = data.key;      
        this.resumes = data.resumes;
      }.bind(this),
    });
  },

  downloadResume: function (event) {
    event.preventDefault && event.preventDefault();
    downloadFile(event.currentTarget.href, { 'Authorization': 'Bearer ' + this.key }, $(event.currentTarget).data('docname'));
  },

  submitVolunteer: function () {
    var statement= $('#statement').val();
    var selectedResume = $('input[name=resumes]:checked').val(); 
    if(!this.validateFields()){
      if(this.edit){
        this.updateVolunteer();
      }
      else{
        $.ajax({
          url: '/api/volunteer/',
          type: 'POST',
          data: {
            taskId: this.options.data.taskId,
            statementOfInterest:statement,
            resumeId: selectedResume ? selectedResume.split('|')[0] : null,
          },
        }).done( function (data) {      
          this.renderNext();   
        }.bind(this));
      }
    }
  },

  updateVolunteer: function (e) {
    var statement= $('#statement').val();
    var selectedResume = $('input[name=resumes]:checked').val();
    var id= this.edit;
    if (window.cache.currentUser ) {
      $.ajax({
        url: '/api/volunteer/' + id,
        type: 'PUT', 
        data: {
          taskId: this.options.data.taskId,
          statementOfInterest:statement,
          resumeId: selectedResume ? selectedResume.split('|')[0] : null,
        },
      }).done( function (data) {    
        Backbone.history.navigate('/tasks/' + data.taskId , { trigger: true });
      }.bind(this));
    }
  },

  validateFields: function () {
    var children = this.$el.find( '.validate' );
    var abort = false;
    
    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );

    if ($('input[name=resumes]:checked').length == 0) {
      $('#apply-resume').addClass('usa-input-error');            
      $('#apply-resume >.upload-error').show(); 
      $('#apply-resume >.refresh-error').hide(); 
      abort=true;
    }
    if($('#refresh-resumes').css('display') != 'none')
    {
      $('#apply-resume').addClass('usa-input-error');        
      $('#apply-resume>.upload-error').hide(); 
      $('#apply-resume>.refresh-error').show();    
      abort=true;
    }

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }     
    return abort;
   
  },

  validateField: function (e) {
    return validate(e);
  },
  cancel: function (e){
    Backbone.history.navigate('/tasks/' + this.options.data.taskId , { trigger: true });
  },

  characterCount: function () {
    $('#statement').charCounter(3000, {
      container: '#statement-count',
    });
  },

  changeResume: function (){
    if($('[name=resumes]:checked').length>0){ 
      $('#apply-resume').removeClass('usa-input-error');    
      $('#apply-resume>.field-validation-error').hide();   
    }
   
  },

  renderResumes: function () { 
    this.data = { 
      resumes: this.resumes,
      urls: window.cache.currentUser.urls,
      resumeId:this.volunteer.resumeId,
    }; 
    var resumeTemplate = _.template(TaskResumeTemplate)(this.data);
    $('#apply-resume-section').html(resumeTemplate);  
  },

  renderNext: function () {
    this.getTaskCommunityInfo();
    this.data = {
      community: this.task.community,
      opportunity: this.task,
    };
    var nextTemplate = _.template(TaskApplyNextTempalte)(this.data);
    $('#apply-next-section').append(nextTemplate); 
    $('#apply-section').hide();      
    $('#apply-help-section').hide();
  },

  upload: function (){
    window.open(window.cache.currentUser.urls.profileDocuments);          
    $('#upload-resume').hide();
    $('#refresh-resumes').show();
  },

  refresh :function (e) {
    e.preventDefault && e.preventDefault();
    $('#refresh-resumes').hide();
    $('#refreshing-resumes').show();
    this.getResumes();
    this.renderResumes();
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = TaskApplyView;
