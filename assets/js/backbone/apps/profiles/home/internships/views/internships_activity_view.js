// vendor libraries
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');

// internal dependencies
var UIConfig = require('../../../../../config/ui.json');

var InternshipsActivityView = Backbone.View.extend({

  events: {
    'click .js-clickable-row' : 'followLink',
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var data = {
      ui: UIConfig,
      target: this.options.target,
      targetFriendly: i18n.t(this.options.target),
      targetsFriendly: i18n.t(this.options.target + 'Plural'),
      targetCapitalized: this.options.target.charAt(0).toUpperCase() + this.options.target.slice(1),
      handle: this.options.handle,
      showAll: this.options.showAll,
      sort: this.options.sort || 'updatedAt',
      data: this.options.data,
      getStatus: this.options.getStatus,
      count: {},
    };

    for (var i in this.options.data) {
      if (_.isUndefined(data.count[this.options.data[i].state])) {
        data.count[this.options.data[i].state] = 1;
      } else {
        data.count[this.options.data[i].state]++;
      }
    }
    var template = this.options.template(data);
    this.$el.html(template);
    this.$el.localize();

    return this;
  },

  getStatus: function (application) {
    if (application.submittedAt == null) {
      return 'In Progress';
    } else {
      return 'Submitted';
    }
  },

  followLink: function (e) {
    if (e.preventDefault) e.preventDefault();
    Backbone.history.navigate(this.options.target + 's/' + $(e.currentTarget).data('id'), { trigger: true });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = InternshipsActivityView;
