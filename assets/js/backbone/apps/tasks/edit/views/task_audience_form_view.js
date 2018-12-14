var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var UIConfig = require('../../../../config/ui.json');
var marked = require('marked');
var TaskAudienceFormTemplate = require('../templates/task_audience_form_template.html');
var TaskAudienceView = require('./task_audience_form_view');


var TaskAudienceFormView = Backbone.View.extend({
  events: {
    'click .usa-button' : 'submit',
    'click .opportunity-target-audience__button' : 'selectAudience',    
  },

  initialize: function (options){
    this.options = options;       
  },

  render: function () {    
    this.loadAudienceCommunityData();
    return this;
  },

  loadAudienceCommunityData:function (){
    $.ajax({
      url: '/api/task/communities',
      dataType: 'json',
      success: function (data){        
        if (data.federal.length == 0 && data.student.length == 0) {
          Backbone.history.navigate('/tasks/new', { trigger : true, replace: true });
        } else {
          var template = _.template(TaskAudienceFormTemplate)({
            communities: data,
          });
          this.$el.html(template);
          setTimeout(function () {
            if(data.federal.length > 0 && data.student.length == 0) {
              this.target = 'federal';
              $('#federal-employees').addClass('selected');
              $('.student-programs').hide();
              $('#continue').removeAttr('disabled'); 
            } else if (data.federal.length == 0 && data.student.length > 0) {
              this.target = 'student';
              $('#students').addClass('selected'); 
              $('.federal-programs').hide();
              $('#continue').removeAttr('disabled'); 
            } else {
              $('.federal-programs').hide();
              $('.student-programs').hide();
            }
            $('#search-results-loading').hide();
          }.bind(this), 50);
        }
      }.bind(this),
    });
  },

  selectAudience: function (e) {   
    if($(e.currentTarget).val() == 'Students') {
      this.target = 'student';
      $('.student-programs').show();
      $('.federal-programs').hide(); 
      $('#students').addClass('selected');  
    } else {
      this.target = 'federal';
      $('.student-programs').hide();
      $('.federal-programs').show();
      $('#federal-employees').addClass('selected');      
    } 
    $('#continue').removeAttr('disabled');    
  },

  submit: function (e) {
    if ( e.preventDefault ) { e.preventDefault(); }
    if ( e.stopPropagation ) { e.stopPropagation(); }
    switch ($(e.currentTarget).data('state')) {
      case 'cancel':
        window.history.back();
        break;
      default:
        var communityId = $('#' + this.target + '-programs').val();
        Backbone.history.navigate('/tasks/new' + (communityId ? '?cid=' + communityId : ''), { trigger: true });
        break;
    }
  },
 
  cleanup: function () {
    removeView(this);
  },
});
module.exports= TaskAudienceFormView;