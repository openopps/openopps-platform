/**
 * Modal component
 *
 * {
 *    el: [parent element],
 *    id: [#id],
 *    modalTitle: [header title],
 *    alert: { // alert message
 *      type: [info|error|warning],
 *      text: [body text]
 *    },
 *    modalBody: [body content],
 *    disableClose: [true|false],
 *    secondary: { // secondary button (optional)
 *      text: [button text],
 *      action: [function]
 *    },
 *    primary: { // primary button
 *      text: [button text],
 *      action: [function]
 *    },
 *    cleanup: [function] // additional clean up to preform
 * }
 *
 * var modal = new Modal({ el: '#site-modal' ... }).render();
 * modal.cleanup();
 */

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseComponent = require('../base/base_component');
var ModalTemplate = require('./modal_template.html');

var Modal = BaseComponent.extend({
  events: {
    'keydown': 'checkTabbing',
    'click .link-backbone': 'link',
    'click #primary-btn': 'primaryAction',
    'click #secondary-btn': 'secondaryAction',
    'click .usajobs-modal__close': 'cleanup',
  },

  initialize: function (options) {
    this.options = options;
    this.options.secondary = this.options.secondary || false;
    this.options.modalAlert = this.options.alert || false;
    this.options.disableClose = this.disableClose || false;
  },

  render: function () {
    var compiledTemplate = _.template(ModalTemplate)(this.options);
    this.$el.html(compiledTemplate);
    $('body').addClass('.modal-is-open');
    $('body').append('<div class="usajobs-modal__canvas-blackout" tabindex="-1" aria-hidden="true"></div>');
    setTimeout(function () {
      this.$el.find(':tabbable').first().focus();
    }.bind(this), 100);
    return this;
  },

  checkTabbing: function (e) {
    var inputs = this.$el.find(':tabbable');
    if (e.keyCode === 9 && !e.shiftKey && e.target == inputs.last()[0]) {
      e.preventDefault();
      inputs.first().focus();
    } else if (e.keyCode === 9 && e.shiftKey && e.target == inputs.first()[0]) {
      e.preventDefault();
      inputs.last().focus();
    }
  },

  primaryAction: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.options.primary.action();
  },

  secondaryAction: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.options.secondary.action();
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    // hide the modal, wait for it to close, then navigate
    $('#' + this.options.id).bind('hidden.bs.modal', function () {
      linkBackbone(e);
    }).modal('hide');
  },

  cleanup: function () {
    if(this.options.cleanup) {
      this.options.cleanup();
    }
    $('.usajobs-modal__canvas-blackout').remove();
    $('.modal-is-open').removeClass();
    removeView(this);
  },
});


module.exports = Modal;
