var _ = require('underscore');
var Backbone = require('backbone');
var AppsRouter = require('./apps-router');
import User from '../utils/user';

var Application = {
  started: null,

  // Initialize and fire up the application.
  initialize: function() {
    var self = this;
    // Cache user
    // Check if a user is already defined
    if (!_.isUndefined(backendUser)) {
      window.cache.currentUser = new User(backendUser);
    }
    if (!_.isUndefined(systemName)) {
      window.cache.system.name = systemName;
    }

    // Create a user events handler
    _.extend(window.cache.userEvents, Backbone.Events);

    // Mixin backbone events into our pub sub handler
    _.extend(entities.request, Backbone.Events);

    // Mixin backbone events into our rendering event handler
    _.extend(rendering, Backbone.Events);

    if (this.started) {
      self.started = false;
      this.application.initialize();
    } else {
      this.application = AppsRouter.initialize();
      self.started = true;
    }
  }
};

// Backbone Multi-tenant router firing up.
module.exports = Application;
