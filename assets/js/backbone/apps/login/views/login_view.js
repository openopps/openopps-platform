define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!login_template',
  'modal_component',
  'registration_view'
], function ($, _, Backbone, utils, LoginTemplate, ModalComponent, RegistrationView) {

  var LoginView = Backbone.View.extend({

    events: {
      'click .oauth-link'              : 'link',
      'click #login-password'          : 'showLogin',
      'click #login-register'          : 'showRegister',
      'submit #login-password-form'    : 'submit'
    },

    initialize: function (options) {
      this.options = options;
    },

    render: function () {
      data = {
        login: this.options.login,
        message: this.options.message
      }
      var template = _.template(LoginTemplate, data);
      this.$el.html(template);
      return this;
    },

    link: function (e) {
      if (e.preventDefault) e.preventDefault();
      var link = $(e.currentTarget).attr('href');
      window.location.href = link;
    },

    showLogin: function (e) {
      if (e.preventDefault) e.preventDefault();
      $(".login-form").show();
    },

    showRegister: function (e) {
      if (e.preventDefault) e.preventDefault();
      if (this.loginView) this.loginView.cleanup();
      if (this.modalComponent) this.modalComponent.cleanup();

      this.loginView = new RegistrationView({
        el: ".modal-template"
      }).render();
    },

    submit: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();
      var data = {
        username: this.$("#username").val(),
        password: this.$("#password").val(),
        json: true
      };
      $.ajax({
        url: '/api/auth/local',
        type: 'POST',
        data: data
      }).done(function (success) {
        // Set the user object and trigger the user login event
        window.cache.currentUser = success;
        window.cache.userEvents.trigger("user:login", success);
      }).fail(function (error) {
        var d = JSON.parse(error.responseText);
        self.$("#login-error").html(d.message);
        self.$("#login-error").show();
      });
    },

    cleanup: function () {
      removeView(this);
    },
  });

  return LoginView;
});
