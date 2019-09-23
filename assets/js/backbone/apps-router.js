var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var i18n = require('i18next');
var XHR = require('i18next-xhr-backend');
var i18nextJquery = require('jquery-i18next');

var BrowseApp = require('./browse-app');


var initialize = function () {
  var router, browse;

  // Initialize the internationalization library and start Backbone when it's done initializing.
  //var i18nConfigJSON = require('./config/i18n.json');
  //var i18nConfig = JSON.parse(i18nConfigJSON);
  var i18nConfig = require('./config/i18n.json');
  i18n.use(XHR)
    .init(i18nConfig, function (err, t) {
      // TODO: Not sure if older version of jquery-i18next was
      // used previously, but it seems the version of it
      // on my system doesn't have a 'default' property--
      // 'init' is directly a property of the object itself. -AV
      (i18nextJquery.default || i18nextJquery).init(i18n, $);

      // Here we are going to fire up all the routers for our app to listen
      // in on their respective applications.  We are -testing- this functionality
      // by using the profile application as a starting point (very simple, 1 route).
      browse = BrowseApp.initialize();

      return Backbone.history.start({ pushState: true });

    });

};

module.exports = {
  initialize: initialize,
};
