define([
    'jquery',
    'bootstrap',
    'underscore',
    'backbone',
    'async',
    'i18n',
    'utilities',
    'text!modal_pages_template',
    'modal_pages',
    'modal_component'
], function ($, Bootstrap, _, Backbone, async, i18n, utilities, ModalPagesTemplate, ModalPages, ModalComponent) {

  var EmptyModalView = Backbone.View.extend({

    initialize: function (options) {
      this.options = _.extend(options, this.defaults);
    },

    render: function () {

      var template = _.template(ModalPagesTemplate);
      this.$el.html(template);
      this.$el.i18n();
      // Return this for chaining.
      return this;
    },

    cleanup: function () {
      if (this.md) { this.md.cleanup(); }
      removeView(this);
    }

  });

  return EmptyModalView;
});
