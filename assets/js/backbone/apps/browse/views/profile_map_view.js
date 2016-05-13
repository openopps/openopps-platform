// Use D3 to generate a nice looking world map with dots for our users.
//
// Scaling: pick height and width based on how the view is originally
// scaled. SVG scaling will take care of the rest to make it responsive.
// staticScale stores what that was when map was first drawn, and
// dynamicScale changes as the SVG is resized.
//
// code for world map adapted from https://gist.github.com/mbostock/4180634
// and http://techslides.com/demos/d3/worldmap-template.html
// and http://bl.ocks.org/rveciana/5181105 (tooltips)

var _ = require('underscore');
var Backbone = require('backbone');
var d3 = require('d3');
var leaflet = require('leaflet');
var topojson = require('topojson');
var tooltipTemplate = require('../templates/profile_map_tooltip.html');
var countryData = require('../../../../../data/ne_110m_admin_0_countries.json');

// Forcing a re-render will cause us to lose part of the map's state, but
// we can save it off.
var _currentView = null;

var PeopleMapView = Backbone.View.extend({

  initialize: function(options) {
    this.el = options.el;
    this.target = options.target;
    this.router = options.router;
    this.people = options.people;

    this.width = this.$el.width();
    this.height = Math.round(this.width / 2) - 50;
    this.staticScale = this.width / 960;
    this.$el.height(this.height);

    this.smallestDotPx = 5; // size of smallest dot
    this.minRadius = 40000; // smallest radius size, in meters
    this.dotSizeFactor = options.dotSizeFactor || 3;
    this.center = [25.0, 0.0]; // favor the northern hemisphere
    this.tipDescTemplate = _.template(tooltipTemplate);

    this.countryFillColor = '#cccccc';
    this.countryOutline = '#ffffff';
    this.circleFillColor = '#6191b9';
    this.circleSelectedFillColor = '#f5cb51';
    this.circleOutline = '#ffffff';

    this.map = L.map('browse-map', { scrollWheelZoom: false });
    if (_currentView) {
      this.map.setView(_currentView.center, _currentView.zoom);
    } else {
      this.map.setView(this.center, 2);
    }
  },

  render: function() {
    var self = this;
    this.renderCountries();
    this.renderUserDots();
  },

  /**
   * Render the country basemap from GeoJSON
   */
  renderCountries: function() {
    var self = this;
    var countryStyle = {
      'color': self.countryOutline,
      'fillColor': self.countryFillColor,
      'weight': 1,
      'fillOpacity': 1.00,
      'opacity': 1.00
    };
    L.geoJson(countryData, { style: countryStyle }).addTo(self.map);
  },

  /**
   * Render the user data as dots on the map
   */
  renderUserDots: function() {
    var self = this;
    if (!this.people.length) return;
    // massage data: pivot list of people by city, flatten that into a list with
    // cityname, people in that city, sorted largest first (so largest cities get
    // drawn first (bottom).
    var peopleWithLocations = this.people
      .filter(function(p) {
        return !_.isUndefined(p.location);
      });
    var cityPeopleObj = _.groupBy(peopleWithLocations, function(p) {
      return p.location.name;
    });
    var cityPeopleList = _.map(_.keys(cityPeopleObj), function(c) {
      return {
        cityname: c,
        people: cityPeopleObj[c]
      };
    });
    cityPeopleList = _.sortBy(cityPeopleList, function(cp) {
      return cp.people.length * -1;
    });

    var previouslySelected = null;
    var allCircles = [];

    _.values(cityPeopleList).forEach(function(cp) {
      var cityLoc = cp.people[0].location;

      var tipDesc = this.tipDescTemplate({
        city: cp.cityname,
        count: cp.people.length,
        names: _.map(cp.people, function(p) {
            return p.name;
          }).slice(0, 3).join(', ') // only show three names
      });

      if (!cityLoc.data || !cityLoc.data.lon || !cityLoc.data.lat) {
        //Warning: skipped city, missing data
        return;
      }

      var dotScale = d3.scale.linear()
        .domain([1, cityPeopleList[0].people.length])
        .range([
          this.smallestDotPx * this.staticScale,
          this.smallestDotPx * this.staticScale * this.dotSizeFactor
        ]);
      var scale = dotScale(cp.people.length);

      var circle = L.circleMarker([cityLoc.data.lat, cityLoc.data.lon], {
        weight: 1.0,
        opacity: 1.0,
        color: self.circleOutline,
        fill: true,
        fillColor: self.circleFillColor,
        fillOpacity: 1.0
      });
      var radius = scale;
      circle.setRadius(radius);
      allCircles.push(circle);

      var popup = L.popup({
        'offset': L.point(0, -20 - radius),
        'closeButton': false,
        'autoPan': false
      });
      popup.setContent(tipDesc);
      circle.bindPopup(popup);

      circle.on('mouseover', function(e) {
        this.openPopup();
      });
      circle.on('mouseout', function(e) {
        this.closePopup();
      });
      circle.on('click', function(e) {
        if (previouslySelected === this) {
          // unselect city: remove styling & re-render list w/ default
          this.setStyle({
            fillColor: self.circleFillColor
          });
          self.trigger("browseRemove", { type: "location", render: true });
          previouslySelected = null;
        } else {
          // select city: add styling, render people detail list below
          allCircles.forEach(function(c) {
            c.setStyle({
              fillColor: self.circleFillColor
            });
          });

          this.setStyle({
            fillColor: self.circleSelectedFillColor
          });
          self.trigger("browseRemove", { type: "location", render: false });
          self.trigger("browseSearchLocation", cp.cityname);
          previouslySelected = this;
        }
        e.originalEvent.stopPropagation();
      });
      circle.on("doubleclick", function(e) {
        e.originalEvent.stopPropagation();
      });
      circle.on("mousedown", function(e) {
        e.originalEvent.stopPropagation();
      });

      circle.addTo(this.map);
    }, this);
  },

  cleanup: function() {
    _currentView = {
      center: this.map.getCenter(),
      zoom: this.map.getZoom()
    };
    this.map.remove();
    removeView(this);
  }

});

module.exports = PeopleMapView;
