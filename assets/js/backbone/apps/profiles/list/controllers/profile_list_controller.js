var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

var BaseController = require('../../../../base/base_controller');
var ProfileListView = require('../views/profile_list_view');

var ProfileController = BaseController.extend({

  events: {
  },

  // Initialize the People view
  initialize: function (options) {
    this.profileListView = new ProfileListView(options).render();
  },

  // Cleanup controller and views
  cleanup: function () {
    this.profileListView.cleanup();
    removeView(this);
  },

});

module.exports = ProfileController;
