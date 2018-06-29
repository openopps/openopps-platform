var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var TagFactory = require('../../../components/tag_factory');
var User = require('../../../../utils/user');
var LoginForgotTemplate = require('../templates/login_forgot_template.html');

var LoginForgotView = Backbone.View.extend({
  el: '#container',

  events: {
    'click .oauth-link'       : 'link',
    'blur .validate'          : 'validateField',
    'submit #forgot-form'     : 'submitForgot',
  },

  initialize: function (options) {
    this.options = options;
    this.tagFactory = new TagFactory();
  },

  render: function () {
    var self = this;
    var data = {
      login: this.options.login,
      message: this.options.message,
    };

    var template = _.template(LoginForgotTemplate)(data);
    this.$el.html(template);
    this.$el.localize();

    setTimeout(function () {
      self.$('#fusername').focus();
    }, 500);
    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var link = $(e.currentTarget).attr('href');
    window.location.href = link;
  },

  validateField: function (e) {
    return validate(e);
  },

  submitForgot: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    $('#forgot-submit').attr('disabled', 'disabled');
    var data = {
      username: this.$('#fusername').val(),
    };
    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/forgot',
      type: 'POST',
      data: data,
    }).done(function (success) {
    // Set the user object and trigger the user login event
      self.$('#forgot-done-view').show();
      self.$('#main-content').hide();
    }).fail(function (error) {
      var d = JSON.parse(error.responseText);
      self.$('#forgot-error-text').html(d.message);
      self.$('#forgot-error').show();
      $('#forgot-submit').attr('disabled', null);
    });
  },
});

module.exports = LoginForgotView;
