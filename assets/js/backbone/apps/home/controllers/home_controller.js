var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../base/base_controller');
var HomeView = require('../views/home_view');

var DashboardView = require('../views/home_dashboard_view');

var HomeController = BaseController.extend({
  // The initialize method is mainly used for event bindings (for efficiency)
  initialize: function (options) {
    var self = this;

    if (!window.cache.currentUser) {
      this.homeView = new HomeView().render();
      Backbone.history.navigate('/');
      return this;
    }
    this.homeView = new DashboardView().render();
    Backbone.history.navigate('/dashboard');
    return this;
  },

  // ---------------------
  //= Utility Methods
  // ---------------------
  cleanup: function() {
    if (this.homeView) this.homeView.cleanup();
    removeView(this);
  }

});

module.exports = HomeController;
