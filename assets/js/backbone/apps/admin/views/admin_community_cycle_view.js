var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var LoginConfig = require('../../../config/login.json');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_template.html');
var AdminCommunityUserTable = require('../templates/admin_community_user_table.html');

var AdminCommunityCycleView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
    this.community = {};
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData();
    return this;
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/' + this.options.target + '/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this[this.options.target] = targetInfo;
        this.loadData();
      }.bind(this),
    });
  },

  loadData: function () {
    var data = {
      user: window.cache.currentUser,
      login: LoginConfig,
      community: this.community,
      target: this.options.target,
      name: 'Test',
      postingStartDate: '',
      postingEndDate: '',
      applyStartDate: '',
      applyEndDate: '',
      cycleStartDate: '',
      cycleEndDate: '',
      first: null,
    };

    var template = _.template(AdminCommunityCycleTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    // this.fetchData(this.data);
    this.data.target = this.options.target;
    $('#search-results-loading').hide();
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityCycleView;
