define([
  'jquery',
  'underscore',
  'backbone',
  'async',
  'i18n',
  'utilities',
  'text!home_template'
], function ($, _, Backbone, async, i18n, utils, HomeTemplate) {

  var HomeView = Backbone.View.extend({

    el: "#container",

    events: {
    },

    initialize: function (options) {
      this.options = options;
    },

    render: function () {
      var compiledTemplate;
      var data = {
        hostname: window.location.hostname,
        user: window.cache.currentUser || {},
      };

      compiledTemplate = _.template(HomeTemplate, data);
      this.$el.html(compiledTemplate);
      this.$el.i18n();

      return this;
    },

    cleanup: function () {
      removeView(this);
    },
  });

  return HomeView;
});
