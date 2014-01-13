define([
  'jquery',
  'async',
  'underscore',
  'backbone',
  'utilities',
  'text!home_template'
], function ($, async, dropzone, _, Backbone, utils, HomeTemplate) {

  var HomeView = Backbone.View.extend({

    initialize: function (options) {
      this.options = options;
      this.data = options.data;
    },

    render: function () {
      var template = _.template(HomeTemplate);
      this.$el.html(template);

      return this;
    },

    cleanup: function () {
      if (this.tagView) { this.tagView.cleanup(); }
      if (this.projectView) { this.projectView.cleanup(); }
      if (this.taskView) { this.taskView.cleanup(); }
      removeView(this);
    },

  });

  return HomeView;
});
