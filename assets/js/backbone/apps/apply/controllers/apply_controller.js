var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../base/base_controller');
var ApplyView = require('../views/apply_view');

var ApplyController = BaseController.extend({
  initialize: function (options) {
    this.options = options;
    if(!window.cache.currentUser) {
      Backbone.history.navigate('/login?apply/' + this.options.data.applicationId, { trigger: true });
    } else {
      $.ajax('/api/application/' + options.data.applicationId).done(function (application) {
        this.applyView = new ApplyView({
          el: '#container',
          data: application,
        }).render();
      }.bind(this)).fail(function () {
        // TODO: Need a Whoops! page
      });
    }
    return this;
  },

  cleanup: function () {
    if (this.applyView) this.applyView.cleanup();
    removeView(this);
  },

});

module.exports = ApplyController;
