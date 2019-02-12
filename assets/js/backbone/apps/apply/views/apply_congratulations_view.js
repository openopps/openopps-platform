var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var ApplyCongratulationsView = Backbone.View.extend({

  events: {
    'click .a1' : 'toggleAccordion1',
    'click .a2' : 'toggleAccordion2',
  },

  // initialize components and global functions
  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var ApplyCongratulationsTemplate = require('../templates/apply_congratulations_template.html');
    $('#container').html(_.template(ApplyCongratulationsTemplate));
    $('#search-results-loading').hide();
    this.$el.localize();

    this.data = {
      a1: {
        open: false,
      },
      a2: {
        open: false,
      },
    };

    $('.apply-hide').hide();

    return this;
  },
  
  toggleAccordion1: function (e) {
    var element = $(e.currentTarget);
    this.data.a1.open = !this.data.a1.open;
    element.attr('aria-expanded', this.data.a1.open);
    $('#a1').attr('aria-hidden', !this.data.a1.open);

    $('.a2').attr('aria-expanded', false);
    $('#a2').attr('aria-hidden', true);
    this.data.a2.open = false;
  },
  
  toggleAccordion2: function (e) {
    var element = $(e.currentTarget);
    this.data.a2.open = !this.data.a2.open;
    element.attr('aria-expanded', this.data.a2.open);
    $('#a2').attr('aria-hidden', !this.data.a2.open);

    $('.a1').attr('aria-expanded', false);
    $('#a1').attr('aria-hidden', true);
    this.data.a1.open = false;
  },

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },

});

module.exports = ApplyCongratulationsView;