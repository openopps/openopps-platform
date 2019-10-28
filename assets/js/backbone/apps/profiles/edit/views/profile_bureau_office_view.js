// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var User = require('../../../../../utils/user');
var Login = require('../../../../config/login.json');


// templates
var ProfileBureauOfficeTemplate = require('../templates/profile_bureau_office_template.html');

var profileBureauOfficeView = Backbone.View.extend({
  events: {
    'click #bureau-office-cancel'        : 'cancel', 
    'click #bureau-office-save' : 'submitBureauOffice',
    'change #profile_tag_bureau': 'showOfficeDropdown',
  },
  
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.bureaus                = [];
    this.offices                = {};

  },

  initializeForm: function () {
    this.listenTo(this.model, 'bureau-office:save:success', function (data) {      
      this.data.saved = true; 
      Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
    }.bind(this));
    
    this.listenTo(this.model, 'bureau-office:save:fail', function (data) {
      $('#bureau-office-save').button('fail');
    }.bind(this));
  },

  render: function () {  
    this.initializeBureaus();  
    var data = {
      login: Login,
      data: this.model.toJSON(), 
      bureaus: this.bureaus,    
    };    
   
    var template = _.template(ProfileBureauOfficeTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    this.initializeSelect2(); 
    this.initializeForm();  
    this.initializeFormFields();
    this.showOfficeDropdownRender();
    return this;
  },

  initializeFormFields: function (){
   
    if (!_.isEmpty(this.model.toJSON().bureau)) {
      $('#profile_tag_bureau').select2('data', {id: this.model.toJSON().bureau.bureauId, text: this.model.toJSON().bureau.name});     
    }
    if (!_.isEmpty(this.model.toJSON().office)) {
      $('#profile_tag_office').select2('data', {id: this.model.toJSON().office.officeId, text: this.model.toJSON().office.name});
    }
  },

  initializeBureaus: function () {
    $.ajax({
      url: '/api/enumerations/bureaus', 
      type: 'GET',
      async: false,
      success: function (data) {
        for (var i = 0; i < data.length; i++) {
          this.offices[data[i].bureauId] = data[i].offices ? data[i].offices : [];
        }
        this.bureaus = data.sort(function (a, b) {
          if(a.name < b.name ) { return -1; }
          if(a.name > b.name ) { return 1; }
          return 0;
        });
      }.bind(this),
    });
  },
    
  submitBureauOffice: function (e) {
    e.preventDefault && e.preventDefault();
    var data= this.model.toJSON();
    data.bureauId = this.$('#profile_tag_bureau').select2('data')? this.$('#profile_tag_bureau').select2('data').id : null,
    data.officeId = this.$('#profile_tag_office').select2('data') ? this.$('#profile_tag_office').select2('data').id : null,   
    this.model.trigger('bureau-office:save', data);
    window.cache.currentUser.bureau.bureauId = data.bureauId;
    window.cache.currentUser.office.officeId = data.officeId;
  },

 
  showOfficeDropdownRender: function () {
    if($('#profile_tag_bureau').select2('data')) { 
      var selectData = $('#profile_tag_bureau').select2('data');
      this.currentOffices = this.offices[selectData.id];
      if (this.currentOffices.length) {
        $('.profile_tag_office').show();
        $('#profile_tag_office').removeAttr('disabled', true);
      } else {
        $('#profile_tag_office').attr('disabled', true).select2('data', null);    
      }
    } else {
      $('.profile_tag_office').hide();   
      $('#profile_tag_office').select2('data', null); 
    }
  },

  showOfficeDropdown: function () {
    if($('#profile_tag_bureau').select2('data')) {
      $('#profile_tag_office').select2('data', null);
      var selectData = $('#profile_tag_bureau').select2('data');
      this.currentOffices = this.offices[selectData.id];
      if (this.currentOffices.length) {
        $('.profile_tag_office').show();
        $('#profile_tag_office').removeAttr('disabled', true);
      } else {
        $('#profile_tag_office').attr('disabled', true).select2('data', null);    
      }
    } else {
      $('.profile_tag_office').hide();  
      $('#profile_tag_office').select2('data', null);  
    }
  },

  initializeSelect2: function () {
    $('#profile_tag_bureau').select2({
      placeholder: 'Select a bureau',
      width: '100%',
      allowClear: true,
    });
   
    $('#profile_tag_office').select2({
      placeholder: 'Select an office',
      width: '100%',
      allowClear: true,
      data: function () { 
        return {results: this.currentOffices}; 
      }.bind(this),
    });
    $('#profile_tag_bureau').on('change', function (e) {    
      this.showOfficeDropdown();   
    }.bind(this));
  },

  cancel: function (e) {
    e.preventDefault();
    Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
  },

  cleanup: function () {
    if (this.profileBureauOfficeView) { this.profileBureauOfficeView.cleanup(); }
    removeView(this);
  },
});
  
module.exports = profileBureauOfficeView;