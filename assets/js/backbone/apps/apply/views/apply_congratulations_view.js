var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var ApplyCongratulationsView = Backbone.View.extend({

  events: {
    'click .a1' : 'toggleAccordion1',
    'click .a2' : 'toggleAccordion2',
    'click .d1' : 'toggleDrawer1',
    'click .d2' : 'toggleDrawer2',
    'click .d3' : 'toggleDrawer3',
    'click .d4' : 'toggleDrawer4',
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
      d1: {
        open: false,
      },
      d2: {
        open: false,
      },
      d3: {
        open: false,
      },
      d4: {
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

  toggleDrawer1: function (e) {
    if (!this.data.d1.open) {
      $('#find').slideDown('fast', function () {
        $('.d2, .d3, .d4').attr('aria-expanded', false);
        $('#resume-search, #save-search, #learn-more-govt').attr('aria-hidden', true);
        $('#resume-search, #save-search, #learn-more-govt').css('display', '');
        $('html, body').animate({
          scrollTop: $('.d1').offset().top,
        });
        $('.d1').attr('aria-expanded', 'true');
        $('#find').attr('aria-hidden', 'false');
      });
    } else {
      $('#find').slideUp(function () {
        $('.d1').attr('aria-expanded', 'false');
        $('#find').attr('aria-hidden', 'true');
      });
    }
    this.data.d1.open = !this.data.d1.open;
    this.data.d2.open = false;
    this.data.d3.open = false;
    this.data.d4.open = false;
  },

  toggleDrawer2: function (e) {
    if (!this.data.d2.open) {
      $('#resume-search').slideDown('fast', function () {
        $('.d1, .d3, .d4').attr('aria-expanded', false);
        $('#find, #save-search, #learn-more-govt').attr('aria-hidden', true);
        $('#find, #save-search, #learn-more-govt').css('display', '');
        $('html, body').animate({
          scrollTop: $('.d2').offset().top,
        });
        $('.d2').attr('aria-expanded', 'true');
        $('#resume-search').attr('aria-hidden', 'false');
      });
    } else {
      $('#resume-search').slideUp(function () {
        $('.d2').attr('aria-expanded', 'false');
        $('#resume-search').attr('aria-hidden', 'true');
      });
    }
    this.data.d1.open = false;
    this.data.d2.open = !this.data.d2.open;
    this.data.d3.open = false;
    this.data.d4.open = false;
  },

  toggleDrawer3: function (e) {
    if (!this.data.d3.open) {
      $('#save-search').slideDown('fast', function () {
        $('.d1, .d2, .d4').attr('aria-expanded', false);
        $('#find, #resume-search, #learn-more-govt').attr('aria-hidden', true);
        $('#find, #resume-search, #learn-more-govt').css('display', '');
        $('html, body').animate({
          scrollTop: $('.d3').offset().top,
        });
        $('.d3').attr('aria-expanded', 'true');
        $('#save-search').attr('aria-hidden', 'false');
      });
    } else {
      $('#save-search').slideUp(function () {
        $('.d3').attr('aria-expanded', 'false');
        $('#save-search').attr('aria-hidden', 'true');
      });
    }
    this.data.d1.open = false;
    this.data.d2.open = false;
    this.data.d3.open = !this.data.d3.open;
    this.data.d4.open = false;
  },

  toggleDrawer4: function (e) {
    if (!this.data.d4.open) {
      $('#learn-more-govt').slideDown('fast', function () {
        $('.d1, .d2, .d3').attr('aria-expanded', false);
        $('#find, #resume-search, #save-search').attr('aria-hidden', true);
        $('#find, #resume-search, #save-search').css('display', '');
        $('html, body').animate({
          scrollTop: $('.d4').offset().top,
        });
        $('.d4').attr('aria-expanded', 'true');
        $('#learn-more-govt').attr('aria-hidden', 'false');
      });
    } else {
      $('#learn-more-govt').slideUp(function () {
        $('.d4').attr('aria-expanded', 'false');
        $('#learn-more-govt').attr('aria-hidden', 'true');
      });
    }
    this.data.d1.open = false;
    this.data.d2.open = false;
    this.data.d3.open = false;
    this.data.d4.open = !this.data.d4.open;
  },

  cleanup: function () {
    $('.apply-hide').show();
    removeView(this);
  },

});

module.exports = ApplyCongratulationsView;