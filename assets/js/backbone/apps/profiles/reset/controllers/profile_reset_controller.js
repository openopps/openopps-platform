// internal dependencies
var BaseController = require('../../../../base/base_controller');
var ProfileResetView = require('../views/profile_reset_view');

var ProfileReset = BaseController.extend({
  el: '#container',

  initialize: function (options) {
    this.options = options;
    this.action = options.action;
    this.key = options.key;
    this.initializeView();
  },

  initializeView: function () {
    this.profileResetView = new ProfileResetView({
      el: this.$el,
      action: this.action,
      key: this.key,
    }).render();
  },

  cleanup: function () {
    if (this.profileResetView) { this.profileResetView.cleanup(); }
    removeView(this);
  },
});

module.exports = ProfileReset;