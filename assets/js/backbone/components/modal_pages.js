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
define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'base_view',
  'text!modal_wizard_template',
  'modal_wizard_component'
], function ($, _, Backbone, utilities, BaseView, ModalWizardTemplate, ModalWizard) {

  Application.Component.ModalPages = ModalWizard.extend({

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

    render: function () {
      var data = {
        id: this.options.id,
        modalTitle: this.options.modalTitle,
        draft: this.options.draft
      };
      var compiledTemplate = _.template(ModalWizardTemplate, data);
      this.$el.html(compiledTemplate);
      $(".modal").removeClass("fade").show();
      return this;
    },

    cancel: function (e) {
      if (e.preventDefault) e.preventDefault();
      $('.modal').hide();
    },

  });

  return Application.Component.ModalPages;
})