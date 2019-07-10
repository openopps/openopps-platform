var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityFormTemplate = require('../templates/admin_community_form_template.html');
var CommunityModel = require('../../../entities/community/community_model');

var AdminCommunityEditView = Backbone.View.extend({

  events: {
    'click #community-edit-cancel': 'cancel',
    'click #community-edit-save'  : 'save',
    'blur .validate'     : 'validateField',
    'change .validate'   : 'validateField',
  },

  initialize: function (options) {
    this.options = options; 
    this.departments={};  
    return this;
  },

  render: function () {
    $('#search-results-loading').show();
    this.initializeAgencySelect();
    this.loadDepartments();  
    if(this.options.communityId){
      this.loadCommunity();    
    }
    else{
      var data = {
        communityId: '', 
        departments : this.departments,      
      };     
      this.$el.html(_.template(AdminCommunityFormTemplate)(data));   
      this.$el.localize(); 
      this.initializeCounts();
      $('#search-results-loading').hide();   
    }
    return this;
  },

  loadDepartments: function (){ 
    $.ajax({
      url: '/api/admin/agencies',  
      type: 'GET',
      async: false,
      success: function (data){         
        this.departments= data;       
      }.bind(this),
    });
  },

  initializeAgencySelect: function () {
    setTimeout(function () {
      $('#agencies').select2({
        placeholder: 'Select an agency',
        allowClear: true,
      });
      try {
        $('#s2id_agencies').children('.select2-choice').children('.select2-search-choice-close').remove();
      } catch (error) { /* swallow exception because close image has already been removed*/ }
    }, 50);
  },

  initializeListeners: function () {
    this.listenTo(this.community, 'community:save:success', function () {
      Backbone.history.navigate('/admin/community/' + this.options.communityId + '?updateSuccess', { trigger: true });
    }.bind(this));
    this.listenTo(this.community, 'community:update:error', function () {
      $('#community-save-error').show();
      $('#community-save-error').get(0).scrollIntoView();
    });
  },

  initializeformFields: function (community){
    this.$('#communityType').val(community.communityType);
    $('#targetAudience').val(community.targetAudience);
    $('#duration').val(community.duration);
    $('#agencies').val(community.agency.agencyId); 
    $('input[name=community-group][value=' + community.isClosedGroup +']').prop('checked', true);
    $('#community-name').val(community.communityName);
    $('#description').val(community.description);
    $('#community-support-email').val(community.supportEmail);
    $('#application-process').val(community.applicationProcess);
    $('#microsite-url').val(community.micrositeUrl);
    $('#community-mgr-name').val(community.communityManagerName);
    $('#community-mgr-email').val(community.communityManagerEmail);
  },

  getDataFromPage: function (){
    var modelData = {
      communityId: this.options ? this.options.communityId: null,
      communityType: $('#communityType').val(),
      targetAudience:$('#targetAudience').val(),
      duration :$('#duration').val(),
      agencyId  : $('#agencies').val(),
      isClosedGroup: $("input[name='community-group']:checked").val(),            
      communityName: $('#community-name').val(),
      description: $('#description').val(),
      supportEmail: $('#community-support-email').val(),
      applicationProcess:$('#application-process').val(),
      micrositeUrl: $('#microsite-url').val(),
      communityManagerName: $('#community-mgr-name').val(),
      communityManagerEmail: $('#community-mgr-email').val(),
    };
    return modelData;
  },
  loadCommunity: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.communityId,
      dataType: 'json',
      success: function (community) {
        this.community = new CommunityModel(community);
        community.departments=this.departments;      
        this.$el.html(_.template(AdminCommunityFormTemplate)(community));
        this.$el.show();
        this.initializeListeners();
        this.initializeCounts();
        this.initializeAgencySelect();
        this.initializeformFields(community);
        $('#search-results-loading').hide();
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
        showWhoopsPage();
      },
    });
  },

  initializeCounts: function () {
    [{ id: 'community-name', count: 100}, { id: 'description', count: 500}].forEach(function (item) {
      $('#' + item.id).charCounter(item.count, { container: '#' + item.id + '-count' });
    });
  },

  validateField: function (e) {
    return validate(e);
  },

  validateFields: function () {
    return _.reduce(this.$el.find('.validate'), function (abort, child) {
      return validate({ currentTarget: child }) || abort;
    }, false);
  },

  cancel: function (e) {
    e.preventDefault && e.preventDefault();
    window.history.back();
  },

  save: function (e) {
    e.preventDefault && e.preventDefault(); 
    var data= this.getDataFromPage();
    if(this.options.communityId){
      data.updatedAt=$('#updated-at').val();
    }  
    if(this.validateFields()) {
      $('.usa-input-error').get(0).scrollIntoView();
    } else {
      $('#community-save-error').hide();
      if(this.options.communityId){
        this.community.trigger('community:save', data);
      }
      else{
        this.saveCommunity();
      }
    }
  },

  saveCommunity:function (){
    var data= this.getDataFromPage();
    $.ajax({
      url: '/api/community',
      type: 'POST',
      data: data,
      success: function (community) {
        Backbone.history.navigate('/admin/community/' + community.communityId + '?saveSuccess', { trigger: true });
      }.bind(this),
      error: function (err) {
        $('#community-save-error').show();
        $('#community-save-error').get(0).scrollIntoView();      
      }.bind(this),
    });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityEditView;