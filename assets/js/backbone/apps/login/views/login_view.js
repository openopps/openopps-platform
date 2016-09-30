var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LoginPasswordView = require('./login_password_view');
var ModalComponent = require('../../../components/modal');
var TagFactory = require('../../../components/tag_factory');
import User from '../../../../utils/user';

var LoginTemplate = fs.readFileSync(
  __dirname + '/../templates/login_template.html'
).toString();


var LoginView = Backbone.View.extend({
  events: {
    'click .oauth-link': 'link',
    'keyup #rname': 'checkName',
    'change #rname': 'checkName',
    'blur #rname': 'checkName',
    'keyup #rusername': 'checkUsername',
    'change #rusername': 'checkUsername',
    'click #rusername-button': 'clickUsername',
    'keyup #rpassword': 'checkPassword',
    'blur #rpassword': 'checkPassword',
    'keyup #rpassword-confirm': 'checkPasswordConfirm',
    'blur #rpassword-confirm': 'checkPasswordConfirm',
    'click #register-next': 'nextRegistrationView',
    'click #register-previous': 'previousRegistrationView',
    'submit #login-password-form': 'submitLogin',
    'submit #registration-form': 'submitRegister',
    'submit #forgot-form': 'submitForgot'
  },

  initialize: function(options) {
    this.options = options;
    this.tagFactory = new TagFactory();
  },

  render: function() {
    var self = this;
    var data = {
      login: this.options.login,
      message: this.options.message
    };
    var template = _.template(LoginTemplate)(data);
    this.$el.html(template);
    this.$el.localize();
    this.loginPasswordView = new LoginPasswordView({
      el: this.$(".password-view")
    }).render();

    if (data.login.agency.enabled === true || data.login.agency.enabled === true) {

      if (data.login.agency.enabled === true) {
        var agencyTags = this.tagFactory.createTagDropDown({
          type: "agency",
          selector: "#ragency",
          width: "100%",
          multiple: false,
          allowCreate: false
        });
      }

      if (data.login.location.enabled === true) {
        var locationTags = this.tagFactory.createTagDropDown({
          type: "location",
          selector: "#rlocation",
          width: "100%",
          multiple: false
        });
      }

      this.$('#registration-footer-cancel-next').show();
      this.$('#registration-footer-prev-submit').hide();
      this.$('#optional-registration-view').hide();

    }

    setTimeout(function() {
      self.$("#username").focus();
    }, 500);
    return this;
  },

  // functions to switch out the primary and secondary registration views
  // this happens when either agency or location are configured to be required
  // for users to sign up for the system
  nextRegistrationView: function() {
    this.$('#default-registration-view').hide();
    this.$('#optional-registration-view').show();

    this.$('#registration-footer-cancel-next').hide();
    this.$('#registration-footer-prev-submit').show();
  },
  previousRegistrationView: function() {
    this.$('#default-registration-view').show();
    this.$('#optional-registration-view').hide();

    this.$('#registration-footer-cancel-next').show();
    this.$('#registration-footer-prev-submit').hide();
  },

  link: function(e) {
    if (e.preventDefault) e.preventDefault();
    var link = $(e.currentTarget).attr('href');
    window.location.href = link;
  },

  v: function(e) {
    return validate(e);
  },

  submitLogin: function(e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var data = {
      identifier: this.$("#username").val(),
      password: this.$("#password").val(),
      json: true
    };
    $.ajax({
      url: '/api/auth/local',
      type: 'POST',
      data: data
    }).done(function(success) {
      $.ajax({
        url: '/api/user',
        dataType: 'json'
      }).done(function(data) {
        // Set the user object and trigger the user login event
        var user = new User(data);
        console.log('login', user);
        window.cache.currentUser = user;
        window.cache.userEvents.trigger("user:login", user);
      });
    }).fail(function(error) {
      var d = JSON.parse(error.responseText);
      self.$("#login-error").html(d.message);
      self.$("#login-error").show();
    });
  },

  submitRegister: function(e) {
    var self = this,
      $submitButton = self.$('#registration-form [type="submit"]');
    if (e.preventDefault) e.preventDefault();

    $submitButton.prop('disabled', true);
    this.$('#register-previous .error').hide();

    // validate input fields
    var validateIds = ['#rname', '#rusername', '#rpassword'];
    // Only validate terms & conditions if it is enabled
    if (this.options.login.terms.enabled === true) {
      validateIds.push('#rterms');
    }
    if (this.options.login.agency.enabled === true) {
      validateIds.push('#ragency');
    }
    if (this.options.login.location.enabled === true) {
      validateIds.push('#rlocation');
    }

    var abort = false;
    for (var i in validateIds) {
      var iAbort = validate({ currentTarget: validateIds[i] });
      abort = abort || iAbort;
    }
    var passwordSuccess = this.checkPassword();
    var parent = $(this.$("#rpassword").parents('.form-group')[0]);
    if (passwordSuccess !== true) {
      parent.addClass('has-error');
      $(parent.find('.error-password')[0]).show();
    } else {
      $(parent.find('.error-password')[0]).hide();
    }
    var passwordConfirmSuccess = this.checkPasswordConfirm();
    var passwordConfirmParent = $(this.$("#rpassword-confirm").parents('.form-group')[0]);
    if (passwordConfirmSuccess !== true) {
      passwordConfirmParent.addClass('has-error');
      $(passwordConfirmParent.find('.error-password')[0]).show();
    } else {
      $(passwordConfirmParent.find('.error-password')[0]).hide();
    }
    if (abort === true || passwordSuccess !== true || passwordConfirmSuccess !== true) {
      $submitButton.prop('disabled', false);
      this.$('#register-previous .error').show();
      return;
    }

    // Create a data object with the required fields
    var data = {
      name: this.$("#rname").val(),
      username: this.$("#rusername").val(),
      password: this.$("#rpassword").val(),
      tags: [],
      json: true
    };

    if (this.options.login.agency.enabled === true) {
      data.tags.push(this.$("#ragency").select2('data'));
    }

    if (this.options.login.location.enabled === true) {
      data.tags.push(this.$("#rlocation").select2('data'));
    }

    // Add in additional, optional fields
    if (this.options.login.terms.enabled === true) {
      data.terms = (this.$("#rterms").val() === "on");
    }

    // Process tags
    data.tags = _(data.tags).chain()
      .filter(function(tag) {
        return _(tag).isObject() && !tag.context;
      })
      .map(function(tag) {
        return (tag.id && tag.id !== tag.name) ? +tag.id : {
          name: tag.name,
          type: tag.tagType,
          data: tag.data
        };
      }).unique().value();

    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/local/register',
      type: 'POST',
      data: data
    }).done(function(success) {
      $.ajax({
        url: '/api/user',
        dataType: 'json'
      }).done(function(data) {
        // Set the user object and trigger the user login event
        var user = new User(data);
        console.log('registered', user);
        window.cache.currentUser = user;
        window.cache.userEvents.trigger("user:login", user);
      });
    }).fail(function(error) {
      var d = JSON.parse(error.responseText);
      self.$("#registration-error").html(d.message);
      self.$("#registration-error").show();
      $submitButton.prop('disabled', false);
    });
  },

  submitForgot: function(e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var data = {
      username: this.$("#fusername").val()
    };
    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/forgot',
      type: 'POST',
      data: data
    }).done(function(success) {
      // Set the user object and trigger the user login event
      self.$("#forgot-view").hide();
      self.$("#forgot-footer").hide();
      self.$("#forgot-done-view").show();
      self.$("#forgot-done-footer").show();
    }).fail(function(error) {
      var d = JSON.parse(error.responseText);
      self.$("#forgot-error").html(d.message);
      self.$("#forgot-error").show();
    });
  },

  // following doesn't use regular validate() because we want to
  // display the .help-block instead of the .error-* blocks but
  // could change in the future and make validate() more general
  checkName: function(e) {
    var name = this.$("#rname").val();
    if (name && name !== '') {
      $("#rname").closest(".form-group").find(".help-block").hide();
    } else {
      $("#rname").closest(".form-group").find(".help-block").show();
    }
  },

  checkUsername: function(e) {
    var username = $("#rusername").val();
    $.ajax({
      url: '/api/user/username/' + username,
    }).done(function(data) {
      $("#rusername-button").removeClass('btn-success');
      $("#rusername-button").removeClass('btn-danger');
      $("#rusername-check").removeClass('fa fa-check');
      $("#rusername-check").removeClass('fa fa-times');
      if (data) {
        // username is taken
        $("#rusername-button").addClass('btn-danger');
        $("#rusername-check").addClass('fa fa-times');
      } else {
        // username is available
        $("#rusername-button").addClass('btn-success');
        $("#rusername-check").addClass('fa fa-check');
        $("#rusername").closest(".form-group").removeClass('has-error');
        $("#rusername").closest(".form-group").find(".help-block").hide();
      }
    });
  },

  checkPassword: function(e) {
    var rules = validatePassword($("#rusername").val(), $("#rpassword").val());
    var valuesArray = _.values(rules);
    var validRules = _.every(valuesArray);
    var success = true;
    if (validRules === true) {
      $("#rpassword").closest(".form-group").removeClass('has-error');
      $("#rpassword").closest(".form-group").find(".help-block").hide();
    }
    _.each(rules, function(value, key) {
      if (value === true) {
        $(".password-rules .success.rule-" + key).show();
        $(".password-rules .error.rule-" + key).hide();
      } else {
        $(".password-rules .success.rule-" + key).hide();
        $(".password-rules .error.rule-" + key).show();
      }
      success = success && value;
    });
    return success;
  },

  checkPasswordConfirm: function(e) {
    var success = true;
    var password = this.$("#rpassword").val();
    var confirm = this.$("#rpassword-confirm").val();
    if (password === confirm) {
      $("#rpassword-confirm").closest(".form-group").find(".help-block").hide();
    } else {
      $("#rpassword-confirm").closest(".form-group").find(".help-block").show();
      success = false;
    }
    return success;
  },

  clickUsername: function(e) {
    e.preventDefault();
  },

  cleanup: function() {
    if (this.loginPasswordView) { this.loginPasswordView.cleanup(); }
    removeView(this);
  },
});


module.exports = LoginView;
