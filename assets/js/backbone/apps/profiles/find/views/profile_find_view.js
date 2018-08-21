// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var User = require('../../../../../utils/user');

// templates
var ProfileFindTemplate = require('../templates/profile_find_template.html');

var ProfileFindView = Backbone.View.extend({
  events: {
    'click #find-cancel'        : 'cancel',
    'submit #form-profile-find' : 'submitEmail',
  },
  
  initialize: function (options) {
    this.options = options;
  },
  
  render: function () {
    var template = _.template(ProfileFindTemplate)();
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    $('.usajobs-nav__menu').hide();
    $('#usajobs-nav-login-gov-banner').hide();
    return this;
  },

  validateField: function (e) {
    return validate(e);
  },

  cancel: function (e) {
    window.history.back();
  },
  
  submitEmail: function (e) {
    e.preventDefault && e.preventDefault();
    alert('test');
  },
  
  cleanup: function () {
    if (this.ProfileFindView) { this.ProfileFindView.cleanup(); }
    removeView(this);
  },
  
});
  
module.exports = ProfileFindView;