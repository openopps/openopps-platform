
var async = require('async');
var _ = require('underscore');
var Backbone = require('backbone');

var ProfileSettingsTemplate = require('../templates/profile_settings_template.html');

var ProfileSettingsView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    var data = {
      user: window.cache.currentUser || {},
    };
    var template = _.template(ProfileSettingsTemplate)(data);
    this.$el.html(template);
    return this;
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = ProfileSettingsView;
