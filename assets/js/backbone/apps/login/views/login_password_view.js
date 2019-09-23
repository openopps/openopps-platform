var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LoginPasswordTemplate = require('../templates/login_password_template.html');

var LoginPasswordView = Backbone.View.extend({
  events: {
    'blur #rpassword'             : 'checkPassword',
    'blur #rpassword-confirm'     : 'checkPasswordConfirm',
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var template = _.template(LoginPasswordTemplate);
    this.$el.html(template);
    this.checkValidCode(this.options.action);
    return this;
  },

  checkValidCode: function (code) {
    $.ajax({
      url: '/api/auth/checkToken/' + code,
      success: function (data) {
        $('#profile-reset-check').hide();
        // true means the token is a valid reset token
        if (data === false) {
          $('#profile-reset-check-error').show();
        } else {
          this.token = data;
          $('#profile-reset-dialog').show();
        }
      }.bind(this),
      error: function (data) {
        $('#profile-reset-check').hide();
        $('#profile-reset-check-error').show();
      },
    });
  },

  checkPassword: function (e) {
    var rules = validatePassword(this.token.email, this.$('#rpassword').val());
    var valuesArray = _.values(rules);
    var validRules = _.every(valuesArray);
    var success = true;
    if (validRules === true) {
      $('#rpassword').closest('.required-input').removeClass('usa-input-error');
      $('#rpassword').closest('.required-input').find('.field-validation-error').hide();
    } else {
      $('#rpassword').closest('.required-input').addClass('usa-input-error');
      $('#rpassword').closest('.required-input').find('.field-validation-error.error-password').show();
    }
    _.each(rules, function (value, key) {
      if (value === true) {
        $('.password-rules .success.rule-' + key).show();
        $('.password-rules .error.rule-' + key).hide();
      } else {
        $('.password-rules .success.rule-' + key).hide();
        $('.password-rules .error.rule-' + key).show();
      }
      success = success && value;
    });
    return success;
  },

  checkPasswordConfirm: function (e) {
    var success = true;
    var password = this.$('#rpassword').val();
    var confirm = this.$('#rpassword-confirm').val();
    if (password === confirm) {
      $('#rpassword-confirm').closest('.required-input').removeClass('usa-input-error');
      $('#rpassword-confirm').closest('.required-input').find('.field-validation-error').hide();
    } else {
      $('#rpassword-confirm').closest('.required-input').addClass('usa-input-error');
      $('#rpassword-confirm').closest('.required-input').find('.field-validation-error').show();
      success = false;
    }
    return success;
  },

  submitReset: function () {
    if(this.checkPassword() && this.checkPasswordConfirm()) {
      $('#profile-reset-submit').show();
      $('#profile-reset-submit-error').hide();
      this.postReset({
        token: this.options.action,
        password: $('#rpassword').val(),
        json: true,
      });
    }
  },

  postReset: function (data) {
    $.ajax({
      url: '/api/auth/reset/',
      type: 'POST',
      data: data,
      success: function (data) {
        $('#profile-reset-submit').hide();
        if (data === false) {
          $('#profile-reset-submit-error').show();
        }
        else {
          Backbone.history.navigate('/', { trigger: true });
          window.cache.userEvents.trigger('user:request:login', {
            message: 'Your password has been reset.  Please log in to continue.',
          });
        }
      },
      error: function (data) {
        $('#profile-reset-submit').hide();
        $('#profile-reset-submit-error').show();
      },
    });
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = LoginPasswordView;
