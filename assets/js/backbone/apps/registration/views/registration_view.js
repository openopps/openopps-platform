define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!registration_template',
  'modal_component'
], function ($, _, Backbone, utils, RegistrationTemplate, ModalComponent) {

  var RegistrationView = Backbone.View.extend({

    events: {
      'submit #registration-form'    : 'submit'
    },

    initialize: function (options) {
      this.options = options;
    },

    render: function () {
      var template = _.template(RegistrationTemplate);
      this.$el.html(template);
      return this;
    },

    submit: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();
      var data = {
        username: this.$("#username").val(),
        password: this.$("#password").val(),
        json: true
      };
      $.ajax({
        url: '/api/auth/local',
        type: 'POST',
        data: data
      }).done(function (success) {
        // Set the user object and trigger the user login event
        window.cache.currentUser = success;
        window.cache.userEvents.trigger("user:login", success);
      }).fail(function (error) {
        var d = JSON.parse(error.responseText);
        self.$("#registration-error").html(d.message);
        self.$("#registration-error").show();
      });
    },

    cleanup: function () {
      removeView(this);
    },
  });

  return RegistrationView;
});
