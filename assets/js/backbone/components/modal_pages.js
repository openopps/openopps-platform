// This provides dumb multi-section modal functionality
//      without being tied to a form or model
//
// This is all the component expects for it to work:
// <div class='modal-body'>
//  <section class="current">First content section</section>
//  <section>Second content section</section>
//  <section>Third content section</section>
//  <!-- and so on -->
// </div>
//

var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseView = require('../base/base_view');
var ModalWizard = require('../components/modal_wizard');
var EmptyModalView = require('../apps/home/views/empty_modal_view');

var ModalWizardTemplate = fs.readFileSync(
  __dirname + '/modal_wizard_template.html'
).toString();


var ModalPages = ModalWizard.extend({
  events: {
    "click .wizard-forward" : "moveWizardForward",
    "click .wizard-backward": "moveWizardBackward",
    "click .wizard-submit"  : "cancel",
    "click .wizard-cancel"  : "cancel"
  },

  initialize: function (options) {
    this.options = options;
    this.initializeListeners();
  },

  moveWizardForward: function (e) {
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

  moveWizardBackward: function (e) {
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

  wizardButtons: function (e, step) {

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

    if ( prevAvailable ) {
      $("#wizard-backward-button").show();
    } else {
      $("#wizard-backward-button").hide();
    }
    /*
    this.$(".btn").prop('disabled', false);
    $("#wizard-backward-button").prop('disabled', !prevAvailable);
    var disables = step.data('disable-buttons');
    if (disables) {
      disables.split(" ").forEach(function (disable) {
        $("#wizard-" + disable + "-button").prop('disabled', true);
      });
    }
    */
  },


  render: function () {
    var data = {
      id: this.options.id,
      modalTitle: this.options.modalTitle,
      draft: this.options.draft
    };
    var compiledTemplate = _.template(ModalWizardTemplate)(data);
    this.$el.html(compiledTemplate);
    $(".modal").removeClass("fade").show();
    return this;
  },

  cancel: function (e) {
    if (e.preventDefault) e.preventDefault();
    $('.modal').hide();
  },
});


module.exports = ModalPages;
