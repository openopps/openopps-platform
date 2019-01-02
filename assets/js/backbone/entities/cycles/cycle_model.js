var _ = require('underscore');
var Backbone = require('backbone');

var CycleModel = Backbone.Model.extend({
  urlRoot: '/api/cycle',

  initialize: function () {
    this.listenTo(this, 'cycle:save', function (data) {
      this.save(data, {
        success: function (data) {
          this.trigger('cycle:save:success', data);
        }.bind(this),
        error: function ( model, response, options ) {
          this.trigger( 'cycle:save:error', model, response, options );
        }.bind(this),
      });
    });
  },
});

module.exports = CycleModel;