var _ = require('underscore');
var Backbone = require('backbone');

var ProfileModel = require('../../../../entities/profiles/profile_model');
var ProfileFindView = require('../views/profile_find_view');

var ProfileFindController = Backbone.View.extend({
  initialize: function (options) {
    this.options = options;
    this.profileFindView = new ProfileFindView({
      el: this.el,
    }).render();
  },

  cleanup: function () {
    if (this.profileFindView) this.profileFindView.cleanup();
    removeView(this);
  },
});

module.exports = ProfileFindController;
