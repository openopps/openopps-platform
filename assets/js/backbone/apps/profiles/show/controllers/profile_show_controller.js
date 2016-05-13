// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');

// internal dependencies
var BaseController = require('../../../../base/base_controller');
var ProfileModel = require('../../../../entities/profiles/profile_model');
var ProfileView = require('../views/profile_show_view');
var ProfileSettingsView = require('../views/profile_settings_view');
var ProfileResetView = require('../views/profile_reset_view');
var Login = require('../../../../config/login.json');

// templates
var fs = require('fs');
var AlertTemplate = fs.readFileSync(`${__dirname}/../../../../components/alert_template.html`).toString();

var Profile = BaseController.extend({

  // Here we are defining whether or not this is a full-region object
  // or a sub-region of another region.
  region: true,
  subRegion: false,

  el: "#container",

  events: {
  },

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
    if (this.profileResetView) { this.profileResetView.cleanup(); }
    // If the action does not require the profile model, display that action
    if (this.routeId == 'reset') {
      this.profileResetView = new ProfileResetView({
        el: this.$el,
        routeId: this.routeId,
        action: this.action,
        data: this.data
      }).render();
    }
    // otherwise load the profile model and display the appropriate view
    else {
      this.initializeProfileModelInstance();
    }
  },

  initializeProfileModelInstance: function () {
    var self = this;

    if (this.model) this.model.remove();
    this.model = new ProfileModel();

    // prevent directly editing profiles when disabled
    if ((Login.profile.edit === false) && (this.action == 'edit')) {
      var data = {
        alert: {
          message: "<strong>Direct editing of profiles is disabled.</strong>  <a href=\"" + Login.profile.editUrl + "\" title=\"Edit Profile\">Click here to edit your profile</a>"
        }
      };
      var template = _.template(AlertTemplate)(data);
      this.$el.html(template);
      return;
    }
    // var fetchId = null;
    // if (this.id && this.id != 'edit') { fetchId = this.id; }
    this.model.trigger("profile:fetch", this.routeId);
    // process a successful model fetch, and display the model
    this.listenTo(this.model, "profile:fetch:success", function (model) {
      // @instance
      self.model = model;
      var modelJson = model.toJSON();
      _.each(modelJson.tags, function(tag, i) {
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
    this.listenTo(this.model, "profile:fetch:error", function (model, response) {
      // if the user isn't logged in, trigger the login window
      if (response.status === 403) {
        window.cache.userEvents.trigger("user:request:login", {
          message: "You must be logged in to view profiles",
          disableClose: false
        });
      }
      var data = {
        alert: {
          message: "<strong>Unable to load profile.  Please reload this page to try again.</strong><br/>Error: "
        }
      };
      // check if the response provided an error
      if (response.responseText) {
        var err = JSON.parse(response.responseText);
        if (err.message) {
          data.alert.message += _.escape(err.message);
        }
      }
      var template = _.template(AlertTemplate)(data);
      self.$el.html(template);
    });
  },

  initializeProfileViewInstance: function () {
    if (this.action == 'settings') {
      this.settingsView = new ProfileSettingsView({
        el: this.$el,
        model: this.model,
        routeId: this.routeId,
        action: this.action,
        data: this.data
      }).render();
    } else {
      this.profileView = new ProfileView({
        el: this.$el,
        model: this.model,
        routeId: this.routeId,
        action: this.action,
        data: this.data
      }).render();
    }
  },

  cleanup: function() {
    if (this.profileView) { this.profileView.cleanup(); }
    if (this.settingsView) { this.settingsView.cleanup(); }
    removeView(this);
  }

});

module.exports = Profile;
