var _ = require('underscore');
var Backbone = require('backbone');

var ActivityModel = Backbone.Model.extend({
  urlRoot: '/api/admin/activities',
});

module.exports = ActivityModel;
