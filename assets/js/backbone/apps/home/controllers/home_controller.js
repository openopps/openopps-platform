define([
  'jquery',
  'underscore',
  'async',
  'backbone',
  'utilities',
  'base_controller',
  'home_view'
], function ($, _, async, Backbone, utils, BaseController, HomeView) {

  Application.Home = {};

  Application.Home.Controller = BaseController.extend({

    events: {
    },

    // The initialize method is mainly used for event bindings (for efficiency)
    initialize: function (options) {
      var self = this;
      this.homeView = new HomeView().render();
    },

    // ---------------------
    //= Utility Methods
    // ---------------------
    cleanup: function() {
      if (this.homeView) this.homeView.cleanup();
      removeView(this);
    }

  });

  return Application.Home.Controller;
});
