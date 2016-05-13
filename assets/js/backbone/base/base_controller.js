// Base Controller
var _ = require('underscore');
var Backbone = require('backbone');


var BaseController = Backbone.View.extend({
  initialize: function() {},

  // ------------
  //= Class Methods available for other views
  // ------------

  initializeViewSafely: function(viewName) {
    if (this.view) {
      this.view.initialize();
    } else {
      this.view = new viewName();
    }
  },

  cleanup: function() {
    $(this).remove();
  }
});

module.exports = BaseController;
