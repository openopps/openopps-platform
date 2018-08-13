// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');

// internal dependencies
// var BaseController = require('../../../../base/base_controller');
var ProfileModel = require('../../../../entities/profiles/profile_model');
var ProfileFindView = require('../views/profile_find_view');

// templates
var AlertTemplate = require('../../../../components/alert_template.html');

var ProfileFindController = Backbone.View.extend({
  events: {
  },

  initialize: function (options) {
    this.options = options;
    new ProfileFindView({
      el: this.el,
    }).render();
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = ProfileFindController;
