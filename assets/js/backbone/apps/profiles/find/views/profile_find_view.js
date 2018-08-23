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
    'keydown #email-address'   : 'clearError',
    'submit #form-find-profile' : 'submitEmail',
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

  clearError: function (e) {
    var parent = $(e.currentTarget).parents('.required-input')[0];
    $(parent).find('.error-email').hide();
    $(parent).removeClass('usa-input-error');
  },
  
  submitEmail: function (e) {
    e.preventDefault && e.preventDefault();
    if (!this.validateField({ currentTarget: this.$el.find('#email-address') })) {
      $.ajax({
        url: '/api/auth/find',
        type: 'POST',
        data: {
          email: this.$el.find('#email-address').val(),
          id: getUrlParameter('id'),
          h: getUrlParameter('h'),
        },
        success: function (data) {
          self.$('#profile-find-done').show();
          self.$('#main-content').hide();
        }.bind(this),
        error: function (err) {
          // display modal alert type error
        }.bind(this),
      });
    }
  },
  
  cleanup: function () {
    if (this.ProfileFindView) { this.ProfileFindView.cleanup(); }
    removeView(this);
  },
  
});
  
module.exports = ProfileFindView;