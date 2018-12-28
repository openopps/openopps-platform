'use strict';
var _ = require('underscore');
var Backbone = require('backbone');
var CycleModel = require('./cycle_model');

var CycleCollection = Backbone.Collection.extend({
  model: CycleModel,

  url: function () {
    return 'api/cycle/community/' + this.options.communityId;
  },

  initialize: function (options) {
    this.options = options || {};
    var data = options.params || {};
    this.fetch({
      data: data,
      success: function (data) {
        this.trigger('cycle:collection:fetch:success', data);
      },
      error: function (data, xhr) {
        this.trigger('cycle:collection:fetch:error', data, xhr);
      },
    });

    this.listenTo (this, 'cycle:save', function (data) {
      this.saveCycle(data);
    });
  },

  saveCycle: function (data) {

    // cycle = new CycleModel({
    //   cycleId : data['cycleId'],
    // });

    this.add(data)
      .save(null, {
        success: function (model) {
          this.trigger('cycle:save:success', model);
        }.bind(this),
        error: function (model, response, options) {
          this.trigger('cycle:save:error', model, response, options);
        }.bind(this),
      });
  },
});

module.exports = CycleCollection;