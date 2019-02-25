var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var ApplyCongratulationsView = Backbone.View.extend({

  events: {
    'click .accordion-1'            : 'toggleAccordion',
    'click .usajobs-drawer-button'  : 'toggleDrawer',
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

    $('.apply-hide').hide();

    return this;
  },
  
  toggleAccordion: function (e) {
    var element = $(e.currentTarget);
    var target = element.siblings('.usa-accordion-content');
    var otherElements = element.parent('li').siblings('li').find('.usa-accordion-button');
    var otherTargets = element.parent('li').siblings('li').find('.usa-accordion-content');
    var open = element.attr('aria-expanded') == 'true';
    if (!open) {
      otherElements.attr('aria-expanded', false);
      otherTargets.attr('aria-hidden', true);
      element.attr('aria-expanded', true);
      target.attr('aria-hidden', false);
    } else {
      element.attr('aria-expanded', false);
      target.attr('aria-hidden', true);
    }
  },

  toggleDrawer: function (e) {
    var element = $(e.currentTarget);
    var target = element.siblings('.usajobs-drawer-content');
    var otherElements = element.parent('.usajobs-drawer').siblings().find('.usajobs-drawer-button');
    var otherTargets = element.parent('.usajobs-drawer').siblings().find('.usajobs-drawer-content');
    var open = element.attr('aria-expanded') == 'true';
    if (!open) {
      otherElements.attr('aria-expanded', false);
      otherTargets.attr('aria-hidden', true).css('display', '');
      target.slideDown('fast', function () {
        $('html, body').animate({
          scrollTop: element.offset().top,
        });
        element.attr('aria-expanded', 'true');
        target.attr('aria-hidden', 'false');
      });
    } else {
      target.slideUp(function () {
        element.attr('aria-expanded', 'false');
        target.attr('aria-hidden', 'true');
      });
    }
  },

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },

});

module.exports = ApplyCongratulationsView;