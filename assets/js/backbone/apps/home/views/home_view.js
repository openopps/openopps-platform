define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!home_template'
], function ($, _, Backbone, utils, HomeTemplate) {

  var HomeView = Backbone.View.extend({

    events: {
    },

    render: function () {
      var self = this;
      var compiledTemplate = _.template(HomeTemplate);
      this.$el.html(compiledTemplate);
    },

    cleanup: function () {
      removeView(this);
	  // Backbone.history.loadUrl();
    }

  });

  return HomeView;
});
