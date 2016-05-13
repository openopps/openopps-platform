
var async = require('async');
var _ = require('underscore');
var Backbone = require('backbone');

var fs = require('fs');
var ProfileSettingsTemplate = fs.readFileSync(`${__dirname}/../templates/profile_settings_template.html`).toString();

var ProfileSettingsView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    var data = {
      user: window.cache.currentUser || {}
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
