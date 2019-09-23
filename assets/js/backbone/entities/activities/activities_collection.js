var _ = require('underscore');
var Backbone = require('backbone');
var ActivityModel = require('./activity_model');

var ActivityCollection = Backbone.Collection.extend({

  model: ActivityModel,
  url: function () {
    return '/api/activity/' + this.type;
  },

  initialize: function (opts) {
    var self = this,
        data;

    opts = opts || {};
    data = opts.params || {};

    this.type = opts.type || 'badges';
    this.fetch({
      data: data,
      success: function (data) {
        self.trigger('activity:collection:fetch:success', data);
      },
      error: function (data, xhr) {
        self.trigger('activity:collection:fetch:error', data, xhr);
      },
    });
  },

});

module.exports = ActivityCollection;
