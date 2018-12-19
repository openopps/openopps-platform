'use strict';
var _ = require('underscore');
var Backbone = require('backbone');

var SearchModel = Backbone.Model.extend({

  defaults: {
    keyword : "",
    status : [],
    career : "",
    series : [],
    skill : [],
    timerequired : [],
    location: [],
    locationtype : [],
    restrictedtoagency : 'false'
  },

  initialize: function () {

  }
});

module.exports = SearchModel;
