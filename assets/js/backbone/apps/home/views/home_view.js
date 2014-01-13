define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!home_template'
], function ($, _, Backbone, utils, HomeTemplate) {

  var HomeView = Backbone.View.extend({

    initialize: function (options) {
      this.options = options;
    },

    render: function () {
      var template = _.template(HomeTemplate);
      this.$el.html(template);
      return this;
    },

    cleanup: function () {
      removeView(this);
    },
  });

  return HomeView;
});
