define([
  'jquery',
  'underscore',
  'backbone',
  'bootstrap',
  'utilities',
  'base_controller',
  'home_view'
], function ($, _, Backbone, Bootstrap, utils, BaseController, HomeView) {

  Application.Home = BaseController.extend({

    initialize: function ( options ) {
      var self = this;
      this.options = options;
      this.initializeView();
    },

    initializeView: function () {
      var self = this;
      if (this.homeView) {
        this.homeView.cleanup();
      }

      this.homeView = new HomeView({
        el: "#container",
        message: this.options.message
      }).render();
    },

    // ---------------------
    //= UTILITY METHODS
    // ---------------------
    cleanup: function() {
      // don't do anything
      if (this.homeView) { this.homeView.cleanup(); }
      removeView(this);
    }

  });

  return Application.Home;
})
