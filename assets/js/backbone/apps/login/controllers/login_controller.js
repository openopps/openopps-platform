var $ = require('jquery');
window.jQuery = $;    // TODO: this is weird, but Boostrap wants it

var _ = require('underscore');
var Backbone = require('backbone');
var Bootstrap = require('bootstrap');
var BaseController = require('../../../base/base_controller');
var LoginView = require('../views/login_view');
var login = require('../../../config/login.json');
var ModalComponent = require('../../../components/modal');


var Login = BaseController.extend({

  events: {
    "click #register-cancel": "showLogin",
    "click #login-register": "showRegister",
    "click #forgot-done-cancel": "showLogin",
    "click #forgot-cancel": "showLogin",
    "click #forgot-password": "showForgot"
  },

  initialize: function(options) {
    this.options = options;
    this.initializeView();
  },

  initializeView: function() {
    var self = this;
    if (this.loginView) {
      this.loginView.cleanup();
      this.modalComponent.cleanup();
    }

    // initialize the modal
    var disableClose;
    if (!_.isUndefined(this.options.message)) {
      disableClose = this.options.message.disableClose || false;
    }
    this.modalComponent = new ModalComponent({
      el: this.el,
      id: "login",
      modalTitle: "Login or Register",
      disableClose: disableClose
    }).render();

    // put the login view inside the modal
    this.loginView = new LoginView({
      el: ".modal-template",
      login: login,
      message: this.options.message
    }).render();
    this.$("#registration-view").hide();
    this.$("#forgot-view").hide();
    this.$("#forgot-done-view").hide();
    $("#login").modal('show');

    self.listenTo(window.cache.userEvents, "user:login", function(user) {
      // hide the modal
      self.stopListening(window.cache.userEvents);
      // window.cache.userEvents.stopListening();
      $('#login').bind('hidden.bs.modal', function() {
        // if successful, reload page
        Backbone.history.loadUrl();
        window.cache.userEvents.trigger("user:login:success", user);
        if (self.options.navigate) {
          window.cache.userEvents.trigger("user:login:success:navigate", user);
        }
      }).modal('hide');
    });

    // clean up no matter how the modal is closed
    $('#login').bind('hidden.bs.modal', function() {
      window.cache.userEvents.trigger("user:login:close");
      self.cleanup();
    });
  },

  showRegister: function(e) {
    if (e.preventDefault) e.preventDefault();
    this.$("#login-view").hide();
    this.$("#login-footer").hide();
    this.$("#registration-view").show();
    this.$("#registration-footer").show();
    this.$("#forgot-view").hide();
    this.$("#forgot-footer").hide();
    this.$("#forgot-done-view").hide();
    this.$("#forgot-done-footer").hide();
  },

  showLogin: function(e) {
    if (e.preventDefault) e.preventDefault();
    this.$("#login-view").show();
    this.$("#login-footer").show();
    this.$("#registration-view").hide();
    this.$("#registration-footer").hide();
    this.$("#forgot-view").hide();
    this.$("#forgot-footer").hide();
    this.$("#forgot-done-view").hide();
    this.$("#forgot-done-footer").hide();
  },

  showForgot: function(e) {
    if (e.preventDefault) e.preventDefault();
    this.$("#forgot-view").show();
    this.$("#forgot-footer").show();
    this.$("#registration-view").hide();
    this.$("#registration-footer").hide();
    this.$("#login-view").hide();
    this.$("#login-footer").hide();
    this.$("#forgot-done-view").hide();
    this.$("#forgot-done-footer").hide();
  },

  // ---------------------
  //= UTILITY METHODS
  // ---------------------
  cleanup: function() {
    if (this.loginView) { this.loginView.cleanup(); }
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    removeView(this);
  }
});

module.exports = Login;
