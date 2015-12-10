/**
 * This is the main application bootstrap
 * that gets the rest of the apps, routers, etc
 * running.
 */

// Set CSRF header
$.ajaxPrefilter(function(options, originalOptions, jqXHR) {
  var token;
  if (!options.crossDomain) {
    token = $('meta[name="csrf-token"]').attr('content');
    if (token) {
      return jqXHR.setRequestHeader('X-CSRF-Token', token);
    }
  }
});

// Install jQuery plugins
require('blueimp-file-upload/js/vendor/jquery.ui.widget');
i18n = require('i18next-client/i18next.commonjs.withJQuery');
moment = require('moment');

// Set markdown defaults
var marked = require('marked');
var rendererWithExternalLinkSupport = require('../utils/rendererWithExternalLinkSupport')

marked.setOptions({
  sanitize: true,
  renderer: rendererWithExternalLinkSupport.renderer
});

// App
window.Application      = window.Application || {};
window.cache            = { userEvents: {}, currentUser: null, system: {} };

// Events
window.entities = { request: {} };
rendering       = {};

// Set up Backbone to use jQuery
_ = require('underscore');
Backbone = require('backbone');
Backbone.$ = jQuery;

// Global AJAX error listener. If we ever get an auth error, prompt to log
// in otherwise show the error.
$(function () {
  $(document).ajaxError(function (e, jqXHR, settings, errorText) {
    $('.spinner').hide();
    if (jqXHR.status === 401 || jqXHR.status === 403) {
      if (!window.cache || !window.cache.userEvents ||
        !('trigger' in window.cache.userEvents)) return;
      window.cache.userEvents.trigger("user:request:login", {
        disableClose: false,
        message: (jqXHR.responseJSON && jqXHR.responseJSON.message) || ""
      });
    } else {
      $('.alert-global')
        .html("<strong>" + errorText + "</strong>. " +
          (jqXHR.responseJSON && jqXHR.responseJSON.message) || "")
        .show();
    }
  });
});

// Load the application
var appr = require('./app-run');
appr.initialize();
