var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityApplicantSubmittedTemplate = require('../templates/admin_community_applicant_submitted_template.html');

var AdminCommunityApplicantSubmittedView = Backbone.View.extend({

  events: {
  
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
  
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

  loadApplicantsSubmitted:function (Info){
    var cycleId= this.params.get('cid');
    var userId= this.params.get('uid');   
    $.ajax({
      url: '/api/admin/community/applicant/'+ userId +'/submitted/'+ cycleId,
      dataType: 'json',
      success: function (data) { 
        this.studentData= data;    
        this.renderTemplate(Info);     
        $('#search-results-loading').hide();
      }.bind(this),
    });
    return this;
  },

  renderTemplate: function () {   
    var data={
      firstChoice: _.findWhere(this.studentData, { sortOrder: 1 }),
      secondChoice: _.findWhere(this.studentData, { sortOrder: 2 }),
      thirdChoice: _.findWhere(this.studentData, { sortOrder: 3 }),
      community:this.community,
      cycleName: this.getCycleName(),
      studentName:this.params.get('uname') ,
     
    };  
    var template = _.template(AdminCommunityApplicantSubmittedTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    this.data.target = this.options.target;
  },

  loadCommunityData: function () {
    var communityId= this.params.get('cmid');
    $.ajax({
      url: '/api/admin/community/' + communityId,
      dataType: 'json',
      success: function (Info) {
        this.community=Info;
        this.loadApplicantsSubmitted(Info);
        $('#search-results-loading').hide();
      }.bind(this),
    });
    return this;
  },
  getCycleName: function () { 
    var paramCycleId= this.params.get('cid'); 
    var cycleName = _.find(this.community.cycles, function (cycle) { return cycle.cycleId == paramCycleId; });
    if (cycleName) {
      return cycleName.name;
    }
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityApplicantSubmittedView;
