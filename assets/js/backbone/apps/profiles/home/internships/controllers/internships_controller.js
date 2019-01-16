var _ = require('underscore');
var Backbone = require('backbone');
var BaseController = require('../../../../../base/base_controller');
var InternshipsView = require('../views/internships_view');

var InternshipsController = BaseController.extend({
  events: {
    'click .add-opportunity' : 'add',
  },

  initialize: function (options) {
    this.options - options;
    if(!window.cache.currentUser) {
      Backbone.history.navigate('/login?home', { trigger: true });
    } else {
      this.internshipsView = new InternshipsView({
        el: '#container',
        data: options,
      }).render();
    }
    return this;
  },

  add: function (e) {
    Backbone.history.navigate('/tasks/create', { trigger: true });
  },

  cleanup: function () {
    if (this.internshipsView) this.internshipsView.cleanup();
    removeView(this);
  },

});

module.exports = InternshipsController;
