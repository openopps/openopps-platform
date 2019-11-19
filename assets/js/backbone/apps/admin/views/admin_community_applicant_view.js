var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityApplicantTemplate = require('../templates/admin_community_applicant_template.html');


var AdminCommunityApplicantView = Backbone.View.extend({

  events: {
     
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.community ={};
   
    this.data = {
      user: window.cache.currentUser,
      target: this.options.target,
    };
  
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData(); 
    return this;
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.targetId,
      dataType: 'json',
      success: function (Info) {
        this.community=Info;
        this.loadApplicants();    
        $('#search-results-loading').hide();
      }.bind(this),
    });
    return this;
  },

  loadApplicants:function (Info){
    var cycleId= this.params.get('cid');
    $.ajax({
      url: '/api/admin/community/' + this.options.targetId +'/applicants/' + cycleId,
      dataType: 'json',
      success: function (data) {
        this.applicants= data;   
        this.renderTemplate();     
        $('#search-results-loading').hide();
      }.bind(this),
    });
    return this;
  },
  getStatus: function (application) {
    if (application.submittedAt == null) {
      if(new Date(application.applyEndDate) > new Date()) {
        return 'In progress';
      } else {
        return 'Not submitted';
      }
    } else if (application.sequence == 3) {
      if (application.taskState == 'completed') {
        if (application.internshipComplete) {
          return 'Completed';
        } else if (application.reviewProgress == 'Primary' && !application.internshipComplete) {
          return 'Not completed';
        } else if (application.reviewProgress == 'Alternate') {
          return 'Alternate';
        } else {
          return 'Not selected';
        }
      } else {
        if (application.reviewProgress == 'Primary') {
          return 'Primary Select';
        } else if (application.reviewProgress == 'Alternate') {
          return 'Alternate Select';
        } else {
          return 'Not selected';
        }
      }
    } else {
      return 'Applied';
    }
  },

  renderTemplate: function () {  
    var data={
      applicants:this.applicants,
      community:this.community,
      cycleId: this.params.get('cid'),
      getStatus: this.getStatus,
    };
    
    var template = _.template(AdminCommunityApplicantTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    this.data.target = this.options.target;
  },
 
  cleanup: function () {  
    removeView(this);
  },

});

module.exports = AdminCommunityApplicantView;
