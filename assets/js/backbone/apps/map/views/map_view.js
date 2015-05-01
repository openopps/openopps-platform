// Use D3 to generate a nice looking world map with dots for our users.
//
// Note on picking the width and height in render(). This sets the
// height and width based on how the view is originally scaled.
// SVG scaling will take care of the rest to make it responsive.
// This approach will be good for small screens, but can look bad
// when you start small and scale up large.
//
// code for world map adapted from https://gist.github.com/mbostock/4180634
// and http://techslides.com/demos/d3/worldmap-template.html

var _ = require('underscore');
var Backbone = require('backbone');
var d3 = require('d3');


var MapView = Backbone.View.extend({

  initialize: function (options) {
    this.el = options.el;
    this.people = options.people;
    this.countries = options.countries;
  },

  render: function () {
    this.width = this.$el.width();
    this.height = Math.round(this.width / 2);

    // Plot map
    this.svg = d3.select(this.el).append('svg')
      .attr("class", "userMap")
      .attr("preserveAspectRatio", "xMaxYMid")
      .attr("meetOrSlice", "slice")
      .attr("viewBox", "0 0 " + this.width + " " + this.height);

    // dividing by 2*pi makes with width fit perfectly
    // center favors the northern hemisphere; rotate breaks map in pacific
    this.projection = d3.geo.mercator()
      .scale(this.width / 2 / Math.PI)
      .center([0, 15])
      .rotate([-10, 0]);

    var path = d3.geo.path()
      .projection(this.projection);

    this.svg.selectAll(".country")
      .data(this.countries)
      .enter().insert("path", ".boundary")
      .attr("class", "country")
      .attr("d", path);

    // Plot users
    var users = this.svg.append("g");
    var locationTags = this.people
      .pluck('location')
      .filter(function (p) {
        return !_.isUndefined(p)
      });

    _.each(locationTags, function (locationTag) {
      var loc = locationTag.tag.data;
      var userDot = users.append("g").attr("class", "userDot");
      var projectedPoint = this.projection([loc.lon, loc.lat]);
      userDot.append("svg:circle")
        .attr("class", "point")
        .attr("cx", projectedPoint[0])
        .attr("cy", projectedPoint[1])
        .attr("r", 6)
    }, this);
  },

  close: function () {
    this.remove();
  }

});

module.exports = MapView;
