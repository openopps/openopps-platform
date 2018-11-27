var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require.bind('../../../../base/base_controller');
var InternshipPreviewView = require('../views/internship_preview_view');
var Login = require('../../../../config/login.json');

var InternshipController = BaseController.extend({
  // The initialize method is mainly used for event bindings (for efficiency)
  initialize: function (options) {
    this.internshipPreviewView = new InternshipPreviewView().render();
    return this;
  },

  // ---------------------
  //= Utility Methods
  // ---------------------
  cleanup: function () {
    if (this.internshipPreviewView) this.internshipPreviewView.cleanup();
    removeView(this);
  },

});

module.exports = InternshipController;
