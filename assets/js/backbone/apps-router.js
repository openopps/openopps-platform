import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';

var fs = require('fs');
var i18n = require('i18next');
var XHR = require('i18next-xhr-backend');
var i18nextJquery = require('jquery-i18next');

var BrowseApp = require('./browse-app');


var initialize = function() {
  var router, browse;

  // Initialize the internationalization library and start Backbone when it's done initializing.
  var i18nConfigJSON = fs.readFileSync(__dirname + ('/config/i18n.json')).toString();
  var i18nConfig = JSON.parse(i18nConfigJSON);
  i18n.use(XHR)
    .init(i18nConfig, function(err, t) {
      i18nextJquery.default.init(i18n, $);

      // Here we are going to fire up all the routers for our app to listen
      // in on their respective applications.  We are -testing- this functionality
      // by using the profile application as a starting point (very simple, 1 route).
      browse = BrowseApp.initialize();

      return Backbone.history.start({ pushState: true });

    });

};

module.exports = {
  initialize: initialize
};
