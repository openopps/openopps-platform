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
define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'base_component',
  'text!modal_wizard_template'
], function ($, _, Backbone, utilities, BaseComponent, ModalWizardTemplate) {

  Application.Component.ModalWizard = BaseComponent.extend({

    template: _.template(ModalWizardTemplate),

    events: {
      "click .wizard-forward" : "moveWizardForward",
      "click .wizard-backward": "moveWizardBackward",
      "click .wizard-submit"  : "submit"
    },

    intialize: function (options) {
      this.options = _.extend(this.defaults, options);
      this.render();
    },

    render: function () {

      if (this.options) {
        this.data = {
          id: this.options.id,
          modalTitle: this.options.modalTitle
        }
      }

      var compiledTemplate = this.template(this.data);
      this.$el.append(compiledTemplate);

      return this;
    },

    // In order for the ModalWizard to work it expects a section
    // by section layout inside the modal, with a 'current' class on
    // the first you want to always start on (re)render.
    moveWizardForward: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      // Store $(".current") in cache to reduce query times for DOM lookup
      // on future children and adjacent element to the current el.
      var current   = $(".current");
          next      = current.next(),
          nextHtml  = next.html();

      var nextWizardStep = {
        exists: function () {
          return !_.isUndefined(nextHtml)
        },
        doesNotExist: function () {
          return _.isUndefined(nextHtml)
        }
      }

      var child = current.next().children()[1]
      var nextChild = $(child).next().children("input[type='data']")
      if (_.isEqual(nextChild.length, 0)) {
        // no-op
      } else {
        $("button.wizard-forward").hide();
        $("button.wizard-submit").show();
      };

      if (nextWizardStep.exists()) {
        hideCurrentAndInitializeNextWizardStep();
      } else if (nextWizardStep.doesNotExist()) {
        console.log("And here we switch the the button logic to now ready for submit.")
      };

      function hideCurrentAndInitializeNextWizardStep () {
        current.hide();
        current.removeClass("current");
        next.addClass("current");
        next.show();
      }

    },

    updateButtonForSubmit: function (self) {
      $(e.currentTarget).text("Submit");
    },

    moveWizardBackward: function (e) {
      if (e.preventDefault) e.preventDefault();

      var current   = $(".current"),
          prev      = current.prev(),
          prevHtml  = prev.html();

      if (!_.isUndefined(prevHtml)) {
        current.children().hide();
        current.removeClass("current");
        prev.addClass("current");
        prev.children().show();
      } else {
        return;
      }
    },

    // Dumb submit.  Everything is expected via a promise from
    // from the instantiation of this modal wizard.
    submit: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      this.collection.trigger(this.modelName + ":save", this.data);

    },

    cleanup: function () {
      $(this.el).children(".modal").remove();
    }
  });

  return Application.Component.ModalWizard;
})