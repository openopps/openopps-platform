var Bootstrap = require('bootstrap');
var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
// TODO: var ModalPagesTemplate = require('../../../components/modal_pages_template.html');
var ModalPagesTemplate = "";
var ModalPages = require('../../../components/modal_pages');
var ModalComponent = require('../../../components/modal');

var EmptyModalView = Backbone.View.extend({

  initialize: function (options) {
    this.options = _.extend(options, this.defaults);
  },

  render: function () {

  var template = _.template(ModalPagesTemplate);
    this.$el.html(template);
    //TODO: this.$el.localize();
    // Return this for chaining.
    return this;
  },

  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    removeView(this);
  }

});

module.exports = EmptyModalView;
