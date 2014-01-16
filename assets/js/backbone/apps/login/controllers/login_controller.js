define([
  'jquery',
  'underscore',
  'backbone',
  'bootstrap',
  'utilities',
  'base_controller',
  'login_view',
  'login_config',
  'modal_component',
  'registration_view'
], function ($, _, Backbone, Bootstrap, utils, BaseController, LoginView, Login, ModalComponent, RegistrationView) {

  Application.Login = BaseController.extend({

    events: {
      "click .login-register"    : "showRegister"
    },

    initialize: function ( options ) {
      var self = this;
      this.options = options;
      this.initializeView();
    },

    initializeView: function () {
      var self = this;
      if (this.loginView) {
        this.loginView.cleanup();
        this.modalComponent.cleanup();
      }

      this.modalComponent = new ModalComponent({
        el: this.el,
        id: "login",
        modalTitle: "Login or Register"
      }).render();

      this.loginView = new LoginView({
        el: ".modal-template",
        login: Login,
        message: this.options.message
      }).render();
      $("#login").modal('show');

      self.listenTo(window.cache.userEvents, "user:login", function (user) {
        // hide the modal
        self.stopListening(window.cache.userEvents);
        // window.cache.userEvents.stopListening();
        $('#login').bind('hidden.bs.modal', function() {
          // reload the page after login
          Backbone.history.loadUrl();
          window.cache.userEvents.trigger("user:login:success", user);
          self.cleanup();
        }).modal('hide');
      });
    },


    showRegister: function (e) {
      if (e.preventDefault) e.preventDefault();

      if (this.loginView) this.loginView.cleanup();
      if (this.modalComponent) this.modalComponent.cleanup();

      this.modalComponent = new ModalComponent({
        el: "#container",
        id: "login-register",
        modalTitle: "REGISTER FINALLY! From Login Controller!!!"
      }).render();

      this.loginView = new RegistrationView({
        el: ".modal-template",
        message: this.options.message
      }).render();

    },

    // ---------------------
    //= UTILITY METHODS
    // ---------------------
    cleanup: function() {
      // don't do anything
      if (this.loginView) { this.loginView.cleanup(); }
      if (this.modalComponent) { this.modalComponent.cleanup(); }
      removeView(this);
    }

  });

  return Application.Login;
})
