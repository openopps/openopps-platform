// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');

// internal dependencies
var BaseController = require('../../../../base/base_controller');
var ProfileModel = require('../../../../entities/profiles/profile_model');
var ProfileFindView = require('../views/profile_find_view');
var Login = require('../../../../config/login.json');

// templates
var AlertTemplate = require('../../../../components/alert_template.html');

var ProfileFindController = BaseController.extend({

  // Here we are defining whether or not this is a full-region object
  // or a sub-region of another region.
  region: true,
  subRegion: false,

  el: '#container',

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    
    this.cleanup();
    this.render();
  },

  render: function (e) {
    if (e && e.preventDefault) { e.preventDefault(); }
    this.cleanup();
    this.profileFindView = new ProfileFindView({
      el: '#container',
      // login: login,
      // message: this.options.message,
    }).render();
  },

  cleanup: function () {
    if (this.profileFindView) { this.profileFindView.cleanup(); }
  },
});

module.exports = ProfileFindController;
