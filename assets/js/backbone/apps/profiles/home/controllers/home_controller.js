var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../../base/base_controller');
var HomeView = require('../views/home_view');

var HomeController = BaseController.extend({
  initialize: function (options) {
    this.options - options;
    if(!window.cache.currentUser) {
      Backbone.history.navigate('/login?home', { trigger: true });
    } else {
      this.homeView = new HomeView({
        el: '#container',
        data: options,
      }).render();
    }
    return this;
  },

  cleanup: function () {
    if (this.homeView) this.homeView.cleanup();
    removeView(this);
  },

});

module.exports = HomeController;
