var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_template.html');
var ModalComponent = require('../../../components/modal');

var AdminCommunityCycleView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      user: window.cache.currentUser,
      target: this.options.target,
    };
    this.initializeListeners();
  },

  initializeListeners: function () {
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData();
    return this;
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this.community = targetInfo;
        this.renderTemplate();
      }.bind(this),
    });
  },

  renderTemplate: function () {
    var template = _.template(AdminCommunityCycleTemplate)(this.community);
    this.$el.html(template);
    this.rendered = true;
    this.data.target = this.options.target;
    $('#search-results-loading').hide();
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityCycleView;
