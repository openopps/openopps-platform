// Similar to Modal component in every way in all ways but two:
// 1) This modal has a next button instead of save button.
// 2) This modal has some expectations inside the modal-body form.
//    ^ More on this below
//
// This is all the component expects for it to work:
// <div class='modal-body'>
//  <section class="current">First content section</section>
//  <section>Second content section</section>
//  <section>Third content section</section>
//  <!-- and so on -->
// </div>
//
// REMEMBER: This goes inside your formTemplate.  This
// is the ModalWizardComponent, which is scoped to list controller,
// then the Form itself for the addition to the list is scoped to the
// modal-body within this modal-component template.

var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseView = require('../base/base_view');
var ModalWizardTemplate = fs.readFileSync(
  __dirname + '/modal_wizard_template.html'
).toString();


var ModalWizard = BaseView.extend({
  events: {
    "click .wizard-forward": "moveWizardForward",
    "click .wizard-backward": "moveWizardBackward",
    "click .wizard-submit": "submit",
    "click .wizard-cancel": "cancel",
    "show.bs.modal": "wizardButtons"
  },

  initialize: function(options) {
    this.options = options;
    this.initializeListeners();
  },

  initializeListeners: function() {
    var self = this;
    if (this.model) {
      this.listenTo(this.model, this.options.modelName + ':modal:hide', function() {
        $('.modal.in').modal('hide');
      });
    }
  },

  render: function() {
    var data = {
      id: this.options.id,
      modalTitle: this.options.modalTitle,
      draft: this.options.draft
    };
    var compiledTemplate = _.template(ModalWizardTemplate)(data);
    this.$el.html(compiledTemplate);
    return this;
  },

  /**
   * Set the child of this view, so we can remove it
   * when the view is destroyed
   * @return this for chaining
   */
  setChildView: function(view) {
    this.childView = view;
    return this;
  },

  /**
   * Set the callback on the next button of the modal.
   * Useful for callbacks
   * @return this for chaining
   */
  setNext: function(fn) {
    this.childNext = fn;
    return this;
  },

  /**
   * Set the callback on the submit button of the modal.
   * Useful for callbacks
   * @return this for chaining
   */
  setSubmit: function(fn) {
    this.childSubmit = fn;
    return this;
  },

  // Set up wizard buttons based on whether or not position in flow.
  // Assumes current step if one not given.
  //
  // If you want to force disable one or more buttons on a step of the wizard,
  // add a data-disable-buttons attribute with a space-separated lst.
  wizardButtons: function(e, step) {
    if (_.isUndefined(step)) {
      step = $('.current');
    }
    var prevAvailable = step.prev() && !_.isUndefined(step.prev().html());
    var nextAvailable = step.next() && !_.isUndefined(step.next().html());
    if (nextAvailable) {
      $("#wizard-forward-button").show();
      $("#wizard-create-button").hide();
    } else {
      $("#wizard-forward-button").hide();
      $("#wizard-create-button").show();
    }
    this.$(".btn").prop('disabled', false);
    $("#wizard-backward-button").prop('disabled', !prevAvailable);
    var disables = step.data('disable-buttons');
    if (disables) {
      disables.split(" ").forEach(function(disable) {
        $("#wizard-" + disable + "-button").prop('disabled', true);
      });
    }
  },

  // In order for the ModalWizard to work it expects a section
  // by section layout inside the modal, with a 'current' class on
  // the first you want to always start on (re)render.
  moveWizardForward: function(e) {
    if (e.preventDefault) e.preventDefault();

    // Store $(".current") in cache to reduce query times for DOM lookup
    // on future children and adjacent element to the current el.
    var current = $(".current");
    var next = current.next();

    // Notify the sub-view to see if it is safe to proceed
    // if not, return and stop processing.
    if (this.childNext) {
      var abort = this.childNext(e, current);
      if (abort) return;
    }
    this.wizardButtons(null, next);
    current.hide();
    current.removeClass("current");
    next.addClass("current");
    next.show();
  },

  moveWizardBackward: function(e) {
    if (e.preventDefault) e.preventDefault();

    var current = $(".current");
    var prev = current.prev();

    if (!_.isUndefined(prev.html())) {
      this.wizardButtons(null, prev);
      current.hide();
      current.removeClass("current");
      prev.addClass("current");
      prev.show();
    }
  },

  // Dumb submit.  Everything is expected via a promise from
  // from the instantiation of this modal wizard.
  submit: function(e) {
    if (e.preventDefault) e.preventDefault();

    var d = this.options.data(this);
    var abort = false;
    var state = $(e.currentTarget).data('state');

    // pass the data to the view
    if (this.childSubmit) {
      // if submit returns true, abort modal processing
      abort = this.childSubmit(e, this.$(".current"));
    }

    if (abort === true) {
      return;
    }

    $('.modal.in').modal('hide');
    if (state) d.state = state;
    this.collection.trigger(this.options.modelName + ":save", d);
  },

  cancel: function(e) {
    if (e.preventDefault) e.preventDefault();
    $('.modal.in').modal('hide');
  },

  cleanup: function() {
    if (this.childView) { this.childView.cleanup(); }
    removeView(this);
  }
});

module.exports = ModalWizard;
