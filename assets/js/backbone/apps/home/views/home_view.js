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
  'text!home_template',
  'modal_pages',
  'empty_modal_view'
], function ($, _, Backbone, async, utils, 
             i18n, UIConfig,
             Login, LoginController, HomeTemplate, ModalPages, EmptyModalView) {

  var HomeView = Backbone.View.extend({

    el: "#container",

    events: {
      'click .login'          : 'loginClick',
      'click .tos-checkbox'   : 'toggleButton',
      'click .wizard-submit'  : 'updateUserSetting'
    },

    initialize: function (options) {
      this.options = options;
      this.listenTo(window.cache.userEvents, "user:login:success", function (user) {
        Backbone.history.navigate(UIConfig.home.logged_in_path, { trigger: true });
      });

      this.listenTo(window.cache.userEvents, "user:load:usersetting:success", function (user) {
        this.checkModalShow(window.cache.currentUser.id);
      });

      if ( UIConfig.modalHome.show ) {
        this.getUserSettings(window.cache.currentUser.id);
      }

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
          modalTitle: 'Welcome to CrowdWork',
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
      }
    },

    updateUserSetting: function() {

      this.deleteUserSettingByKey("showModalHome");

    },

    getUserSettings: function (userId) {
      //does this belong somewhere else?
      var self = this;
      if ( _.isNull(userId) ){ return null; }
      $.ajax({
        url: '/api/usersetting/'+userId,
        type: 'GET',
        dataType: 'json'
      })
      .success(function(data){
        _.each(data,function(setting){
          //save active settings to the current user object
          if ( setting.isActive ){
            window.cache.currentUser[setting.key]=setting;
          }
        });
        window.cache.userEvents.trigger("user:load:usersetting:success");
      });
    },

    deleteUserSettingByKey: function(settingKey) {
      //this function expects the entire row from usersetting in the form
      //     window.cache.currentUser[settingKey] = {}
      var self = this;

      //if not set skip
      var targetId =  ( window.cache.currentUser[settingKey] ) ? window.cache.currentUser[settingKey].id : null ;

      if ( targetId ){
        $.ajax({
          url: '/api/usersetting/'+targetId,
          type: 'DELETE',
          dataType: 'json'
        })
      }

    },

    saveUserSettingByKey: function(userId, options) {
      //this function expects the entire row from usersetting in the form
      //     window.cache.currentUser[settingKey] = {}
      var self = this;

      //are values the same, stop
      if ( options.newValue == options.oldValue ) { return true; }

      //if delete old is set, delete exisitng value
      //   default is delete
      if ( !options.deleteOld ){
        self.deleteUserSettingByKey(options.settingKey);
      }

      $.ajax({
          url: '/api/usersetting/',
          type: 'POST',
          dataType: 'json',
          data: {
            userId: userId,
            key: options.settingKey,
            value: options.newValue
          }
        });
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

  return HomeView;
});
