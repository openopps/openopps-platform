var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../base/base_controller');
var ApplyView = require('../views/apply_view');

var ApplyController = BaseController.extend({
  initialize: function (options) {
    this.options = options;
    if(!window.cache.currentUser) {
      Backbone.history.navigate('/login?home', { trigger: true });
    } else {
      this.applyView = new ApplyView({
        el: '#container',
        data: options,
      }).render();
    }
    return this;
  },

  cleanup: function () {
    if (this.applyView) this.applyView.cleanup();
    removeView(this);
  },

});

module.exports = ApplyController;
