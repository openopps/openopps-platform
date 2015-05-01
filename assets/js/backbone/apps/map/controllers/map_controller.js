var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../base/base_controller');
var async = require('async');
var MapView = require('../views/map_view');
var ProfilesCollection = require('../../../entities/profiles/profiles_collection');
var d3 = require('d3');
var topojson = require('topojson');


Map = {};

Map.Controller = BaseController.extend({

  initialize: function () {
    var that = this;
    var gatherData = [];
    var profiles;
    var countries;

    gatherData.push(function (cb) {
      profiles = new ProfilesCollection();
      profiles.fetch({
        success: function () {
          cb(null);
        },
        error: function (jqXHR) {
          cb(jqXHR);
        }
      })
    });
    gatherData.push(function (cb) {
      d3.json("data/world-110m.json", function (err, world) {
        if (err) {
          cb(err);
        } else {
          countries = topojson.feature(world, world.objects.countries).features;
          cb(null);
        }
      });
    });
    async.parallel(gatherData, function (err) {
      if (err) return err;
      that.mapView = new MapView({
        el: that.el,
        people: profiles,
        countries: countries
      }).render();
    });
  },

  cleanup: function () {
    if (!this.mapView) return;
    this.mapView.cleanup();
  }

});

module.exports = Map.Controller;
