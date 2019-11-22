var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityApplicantTemplate = require('../templates/admin_community_applicant_template.html');


var AdminCommunityApplicantView = Backbone.View.extend({

  events: {
    'change #sort-applicant-community' : 'sortApplicants',
    'click #applicant-filter-search'   : 'filter',
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.community ={};
   
    this.data = {
      user: window.cache.currentUser,
      target: this.options.target,
      sort: this.params.get('s') || 'name',
      filter: this.params.get('f') || '',
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
      data: {     
        sort: this.data.sort,
        filter:this.data.filter,
      },
      success: function (data) {         
        this.applicants= data.applications;   
        this.renderTemplate();     
        $('#search-results-loading').hide();
      }.bind(this),
    });
    return this;
  },

  sortApplicants: function (e) {
    var target = $(e.currentTarget)[0];
    this.data.sort = target.value;   
    Backbone.history.navigate(this.generateURL(), { trigger: false });
    this.loadApplicants();
    
    window.scrollTo(0, 0);
  },
  generateURL: function () {
    var url = window.location.pathname;
    url += window.location.search.split('&')[0];  
    url += '&s=' + this.data.sort +'&f=' + this.data.filter;  
    return url;
  },

  filter: function (e) {
    var val = $('#applicant-filter').val().trim();
    if (val == this.data.filter) {
      return;
    }
    this.data.filter = val;
    Backbone.history.navigate(this.generateURL(), { trigger: false });
    this.loadApplicants();
    
  },

  renderTemplate: function () {  
    var data={
      applicants:this.applicants,
      community:this.community,
      cycleId: this.params.get('cid'),    
      sort:this.data.sort,
      filter: this.data.filter,
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
