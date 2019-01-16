// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');

// internal dependencies
var BaseController = require('../../../../base/base_controller');
var ProfileModel = require('../../../../entities/profiles/profile_model');
var ProfileView = require('../views/profile_show_view');
var ProfileSettingsView = require('../views/profile_settings_view');
var Login = require('../../../../config/login.json');

// templates
var AlertTemplate = require('../../../../components/alert_template.html');

var Profile = BaseController.extend({
  el: '#container',

  initialize: function (options) {
    this.options = options;
    this.routeId = options.id;
    this.action = options.action;
    this.data = options.data;
    this.initializeController();
  },

  initializeController: function () {
    // Clean up previous views
    if (this.profileView) { this.profileView.cleanup(); }
    if (this.settingsView) { this.settingsView.cleanup(); }
    this.initializeProfileModelInstance();
  },

  initializeProfileModelInstance: function () {
    var self = this;

    if (this.model) this.model.remove();
    this.model = new ProfileModel();

    // prevent directly editing profiles when disabled
    if ((Login.profile.edit === false) && (this.action == 'edit')) {
      var data = {
        alert: {
          message: '<strong>Direct editing of profiles is disabled.</strong>  <a href="' + Login.profile.editUrl + '" title="Edit Profile">Click here to edit your profile</a>',
        },
      };
      var template = _.template(AlertTemplate)(data);
      this.$el.html(template);
      return;
    }
    // var fetchId = null;
    // if (this.id && this.id != 'edit') { fetchId = this.id; }
    if(!window.cache.currentUser) {
      Backbone.history.navigate('/login?profile/' + this.routeId, { trigger: true });
    } else {
      this.model.trigger('profile:fetch', this.routeId);
    }
    // process a successful model fetch, and display the model
    this.listenTo(this.model, 'profile:fetch:success', function (model) {
      // @instance
      self.model = model;
      var modelJson = model.toJSON();
      _.each(modelJson.tags, function (tag, i) {
        if (modelJson.tags[i].type == 'agency') {
          self.model.agency = modelJson.tags[i];
          self.model.agency.tagId = modelJson.tags[i].id;
        }
        else if (modelJson.tags[i].type == 'location') {
          self.model.location = modelJson.tags[i];
          self.model.location.tagId = modelJson.tags[i].id;
        }
      });
      self.initializeProfileViewInstance();
    });
    // if the profile fetch fails, check if it is due to the user
    // not being logged in
    this.listenTo(this.model, 'profile:fetch:error', function (model, response) {
      Backbone.history.navigate('/home', { trigger: true, replace: true });
    });
  },

  initializeProfileViewInstance: function () {
    if (this.action == 'settings') {
      this.settingsView = new ProfileSettingsView({
        el: this.$el,
        model: this.model,
        routeId: this.routeId,
        action: this.action,
        data: this.data,
      }).render();
    } else {
      this.profileView = new ProfileView({
        el: this.$el,
        model: this.model,
        routeId: this.routeId,
        action: this.action,
        data: this.data,
      }).render();
    }
  },

  cleanup: function () {
    if (this.profileView) { this.profileView.cleanup(); }
    if (this.settingsView) { this.settingsView.cleanup(); }
    removeView(this);
  },

});

module.exports = Profile;
