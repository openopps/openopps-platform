// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

// templates
var ProfileFindTemplate = require('../templates/profile_find_template.html');

var ProfileFindView = Backbone.View.extend({
  events: {
    'submit #form-profile-find' : 'submitEmail',
  },
  
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },
  
  render: function () {
    var data = {
      user: window.cache.currentUser || {},
    };
    var template = _.template(ProfileFindTemplate)(data);
    this.$el.html(template);
    $('#search-results-loading').hide();
    return this;
  },
  
  submitEmail: function (e) {
    e.preventDefault && e.preventDefault();
  },
  
  cleanup: function () {
    removeView(this);
  },
  
});
  
module.exports = ProfileFindView;