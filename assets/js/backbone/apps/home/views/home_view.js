var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
var UIConfig = require('../../../config/ui.json');
/** TODO:
var Login = require('../../../config/login.json');
var LoginController = require('../../login/controllers/login_controller');
var ModalPages = require('../../../components/modal_pages');
**/
var fs = require('fs');
var HomeTemplate = fs.readFileSync(__dirname + '/../templates/home_view_template.html').toString();
// TODO: var EmptyModalView = require('../views/empty_modal_view');

var HomeView = Backbone.View.extend({

  el: "#container",

  events: {
    'click .login'          : 'loginClick',
    'click .tos-checkbox'   : 'toggleButton',
    'click .wizard-submit'  : 'updateUserSetting'
  },

  initialize: function (options) {
    this.options = options;
    this.listenTo(window.cache.userEvents, "user:login:success:navigate", function (user) {
      Backbone.history.navigate(UIConfig.home.logged_in_path, { trigger: true });
    });

    this.listenTo(window.cache.userEvents, "user:load:usersetting:success", function (user) {
      this.checkModalShow(window.cache.currentUser.id);
    });

  },

  render: function () {
    var compiledTemplate;
    var data = {
      hostname: window.location.hostname,
      user: window.cache.currentUser || {},
    };
    this.$el.addClass('home');
    compiledTemplate = _.template(HomeTemplate)(data);
    this.$el.html(compiledTemplate);
    // TODO: this.$el.localize();

  return this;
  },

  toggleButton: function (e) {
    if ( $("input.tos-checkbox").prop("checked") ){
      $("button.wizard-submit").removeAttr('disabled');
    } else {
      $("button.wizard-submit").attr('disabled','disabled');
    }
  },

  checkModalShow: function(userId) {

    if ( typeof window.cache.currentUser.showModalHome == "object" && window.cache.currentUser.showModalHome.value == "true" ){

      if (this.modalPages) this.ModalPages.cleanup();
      this.modalPages = new ModalPages({
        el: "#modal_target",
        id: "addSplash",
        modalTitle: 'Welcome to '+ window.cache.system.name,
      }).render();

      this.emptyModalView = new EmptyModalView({
        el: "#addSplash .modal-body",
      }).render();
      // Important: Hide all non-currently opened sections of wizard.
      this.$("section:not(.current)").hide();

      $("button.wizard-submit").attr('disabled','disabled');
      $("button.wizard-submit").html("I Agree");
      this.modalPages.setChildView(this.emptyModalView);
      this.modalPages.setNext(this.emptyModalView.childNext);
      this.modalPages.setSubmit(this.emptyModalView.childNext);
      this.modalPages.wizardButtons(null,$('.current'));
    }
  },

  loginClick: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (window.cache.currentUser) {
      // we're already logged in
      Backbone.history.navigate(UIConfig.home.logged_in_path, { trigger: true });
    } else {
      this.login();
    }
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

module.exports = HomeView;
