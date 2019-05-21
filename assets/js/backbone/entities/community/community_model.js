var _ = require('underscore');
var Backbone = require('backbone');

var CommunityModel = Backbone.Model.extend({
  idAttribute: 'communityId',
  urlRoot: '/api/community',

  initialize: function () {
    this.listenTo(this, 'community:save', function (data) {
      this.save(data, {
        success: function (data) {
          this.trigger('community:save:success', data);
        }.bind(this),
        error: function ( model, response, options ) {
          this.trigger( 'community:save:error', model, response, options );
        }.bind(this),
      });
    });
  },
});

module.exports = CommunityModel;