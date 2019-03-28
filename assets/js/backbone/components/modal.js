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
var CompiledTemplate = null;

var Modal = BaseComponent.extend({
  el: '#site-modal',
  events: {
    'keydown': 'checkTabbing',
    'click .link-backbone': 'link',
    'click #primary-btn': 'primaryAction',
    'click #secondary-btn': 'secondaryAction',
    'click .usajobs-modal__close': 'cleanup',
  },

  initialize: function (options) {
    this.options = options;
    if(_.isUndefined(this.options.secondary)) {
      this.options.secondary = {
        text: 'Cancel',
        action: function () {
          this.cleanup();
        }.bind(this),
      };
    }   
    this.options.alert = this.options.alert || '';
    this.options.action = this.options.action || '';
    this.options.disableClose = this.options.disableClose || false;
    this.options.disablePrimary = this.options.disablePrimary || false;
    this.options.disableSecondary = this.options.disableSecondary || false;
  },

  render: function () {
    CompiledTemplate = _.template(ModalTemplate);
    $('body').addClass('modal-is-open');
    $('body').append('<div class="usajobs-modal__canvas-blackout" tabindex="-1" aria-hidden="true"></div>');
    setTimeout(function () {
      this.$el.find(':tabbable').first().focus();
    }.bind(this), 100);
    this.refresh();
    return this;
  },

  displayError: function (alertText, alertTitle) {
    this.options.primary = null;
    if (this.options.secondary) {
      this.options.secondary = null;
    }
    this.options.disableClose = false;
    this.options.alert = 'error';
    this.options.modalBody = alertText;
    this.options.modalTitle = alertTitle || this.options.modalTitle;
    this.refresh();
  },

  refresh: function () {
    this.$el.html(CompiledTemplate(this.options));
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
    if (!this.options.disablePrimary)
    {
      this.options.primary.action(this);
    }
  },

  secondaryAction: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (!this.options.disableSecondary)
    {
      this.options.secondary.action(this);
    }
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    // hide the modal, wait for it to close, then navigate
    $('#' + this.options.id).bind('hidden.bs.modal', function () {
      linkBackbone(e);
    }).modal('hide');
  },

  cleanup: function () {
    if(this.options.close) {
      this.options.close();
    }
    $('.usajobs-modal__canvas-blackout').remove();
    $('.modal-is-open').removeClass();
    removeView(this);
  },
});


module.exports = Modal;