var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var InternshipPreviewTemplate = require('../templates/internship_preview_template.html');

var InternshipPreviewView = Backbone.View.extend({

  events: {

  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var data = {
      user: window.cache.currentUser || {},
    };
    
    var template = _.template(InternshipPreviewTemplate)(data);
    this.$el.html(template);
    this.$el.localize();
    return this;
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = InternshipPreviewView;