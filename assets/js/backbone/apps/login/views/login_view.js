var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LoginPasswordView = require('./login_password_view');
var TagFactory = require('../../../components/tag_factory');
var User = require('../../../../utils/user');
var LoginTemplate = require('../templates/login_template.html');

var LoginView = Backbone.View.extend({
  el: '#container',

  events: {
    'click .oauth-link'      : 'link',
    'blur .validate'         : 'validateField',
    'keypress .form-control' : 'submitOnEnter',
    'click #submitLogin'     : 'submitLogin',
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
    var template = _.template(LoginTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    this.loginPasswordView = new LoginPasswordView({
      el: this.$('.password-view'),
    }).render();

    setTimeout(function () {
      self.$('#uri').focus();
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

  submitOnEnter: function (e) {
    (e.which == 13) && this.submitLogin(e);
  },

  submitLogin: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var data = {
      identifier: this.$('#uri').val() || '',
      password: this.$('#password').val() || '',
      json: true,
    };
    $.getJSON('/csrfToken', function (t) {
      $('meta[name="csrf-token"]').attr('content', t._csrf);
      $.ajax({
        url: '/api/auth',
        type: 'POST',
        data: data,
      }).done(function (success) {
        $.ajax({
          url: '/api/user',
          dataType: 'json',
        }).done(function (data) {
          // Set the user object and trigger the user login event
          var user = new User(data);
          console.log('login', user);
          window.cache.currentUser = user;
          window.cache.userEvents.trigger('user:login:success', user);
        });
      }).fail(function (error) {
        var d = JSON.parse(error.responseText);
        self.$('#login-error-text').html(d.message);
        self.$('#login-error').show();
        self.$('#uri').closest('.required-input').addClass('usa-input-error');
        self.$('#uri').closest('.required-input').find('.field-validation-error.error-email').show();

        self.$('#password').closest('.required-input').addClass('usa-input-error');
        self.$('#password').closest('.required-input').find('.field-validation-error.error-password').show();
      });
    });
  },

  cleanup: function () {
    if (this.LoginView) { this.LoginView.cleanup(); }
    removeView(this);
  },
});

module.exports = LoginView;
