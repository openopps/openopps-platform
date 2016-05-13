/**
 * AcController
 *
 * @module		:: Controller
 * @description	:: Auto-complete service
 */
var _ = require('underscore');
var async = require('async');

var runSearch = function(type, q, params, cb) {
  var prelim = {};
  var results = [];
  var callSource = function(source, done) {
    // Get the source definition that matches the source name
    var src = sails.config.sources[source];
    // Find the source actor that can perform the query
    var actor = sails.services.sources[src.type];
    // Run the query and add the results
    actor.query(q, params, src, function(err, r) {
      if (!err) {
        // preliminarily record the results
        prelim[source] = r;
      }
      done(err);
    });
  };

  // Iterate through each source and query it, compiling the results
  async.each(sails.config.autocomplete[type], callSource, function(err) {
    // put the results in the order specified in the config
    // since async may get the results of each fn in random order
    _.each(sails.config.autocomplete[type], function (source) {
      results = results.concat(prelim[source] || []);
    });
    cb(err, results);
  });

}

/*

TODO:

UNFORTUNATELY This doesn't work because the sails variable is not defined
until after the module is exported.  Could directly import the settings file
with require.

var acControllerImpl = {};
var acControllerKeys = _.keys(sails.config.sources.autocomplete);

// Programatically generate the endpoints based on the
// autocomplete sources defined in the config
for (var i = 0; i < acControllerKeys.length; i++) {
  acControllerImpl[acControllerKeys[i]] = function (req, res) {
    if (!req.param('q')) { return res.send([]); }
    runSearch(acControllerKeys[i], req.param('q'), function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  }
}

module.exports = acControllerImpl;
*/

module.exports = {

  search: function (req, res) {
    if (!req.param('q')) { return res.send([]); }
    var searchTarget = 'search';
    if (req.params.id) {
      searchTarget = 'search-' + req.params.id;
    }
    runSearch(searchTarget, req.param('q'), req.query, function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  },

  attachments: function (req, res) {
    if (!req.param('q')) { return res.send([]); }
    runSearch('attachments', req.param('q'), req.query, function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  },

  inline: function (req, res) {
    if (!req.param('q')) { return res.send([]); }
    runSearch('inline', req.param('q'), req.query, function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  },

  tag: function (req, res) {
    runSearch('tag', req.param('q'), req.query, function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  },

  user: function (req, res) {
    if (!req.param('q')) { return res.send([]); }
    runSearch('user', req.param('q'), req.query, function (err, results) {
      if (err) { return res.send(400, { message: 'Error performing search' }); }
      return res.send(results);
    });
  },

};
