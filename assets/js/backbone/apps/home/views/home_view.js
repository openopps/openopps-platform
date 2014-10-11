define([
  'jquery',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'i18n',
  'json!ui_config',
  'json!login_config',
  'login_controller',
  'text!home_template'
], function ($, _, Backbone, async, utils, 
             i18n, UIConfig,
             Login, LoginController, HomeTemplate) {

  var HomeView = Backbone.View.extend({

    el: "#container",

    events: {
      'click .login'          : 'loginClick'
    },

    initialize: function (options) {
      this.options = options;
      this.listenTo(window.cache.userEvents, "user:login:success", function (user) {
        Backbone.history.navigate(UIConfig.home.logged_in_path, { trigger: true });
      });
    },

    render: function () {
      var compiledTemplate;
      var data = {
        hostname: window.location.hostname,
        user: window.cache.currentUser || {},
      };

      this.$el.addClass('home');
      compiledTemplate = _.template(HomeTemplate, data);
      this.$el.html(compiledTemplate);
      this.$el.i18n();

      return this;
    },

loginClick: function (e) {
      if (e.preventDefault) e.preventDefault();
      this.login();
    },

    login: function (message) {
      if (this.loginController) {
        this.loginController.cleanup();
      }
      this.loginController = new LoginController({
        el: '#login-wrapper',
        message: message
      });
    },

    cleanup: function () {
      this.$el.removeClass('home');
      removeView(this);
    },
  });

  return HomeView;
});
