// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

// internal dependencies
var LoginPasswordView = require('../../../login/views/login_password_view');

// templates
var ProfileResetTemplate = require('../templates/profile_reset_template.html');
var ProfileRegistrationTemplate = require('../templates/profile_registration_template.html');

var ProfileResetView = Backbone.View.extend({
  events: {
    'submit #form-password-reset' : 'submitReset',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    var data = {
      user: window.cache.currentUser || {},
    };
    var template = _.template((this.options.routeId == 'reset') 
      ? ProfileResetTemplate
      : ProfileRegistrationTemplate
    )(data);
    this.$el.html(template);
    this.loginPasswordView = new LoginPasswordView({
      el: this.$('.password-view'),
      action: this.options.action,
    }).render();
    $('#search-results-loading').hide();
    return this;
  },

  submitReset: function (e) {
    e.preventDefault && e.preventDefault();
    this.loginPasswordView.submitReset();
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = ProfileResetView;
