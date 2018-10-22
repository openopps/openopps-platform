var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminCommunityTemplate = require('../templates/admin_community_template.html');
var AdminCommunityView = Backbone.View.extend({

  events: {
    'change #communities': 'changeCommunity',
    // 'change .group': 'renderTasks',
    // 'change .filter': 'renderTasks',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.communityId = options.communityId || options.communities[0].communityId;
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData();
    $('#search-results-loading').hide();
    Backbone.history.navigate('/admin/communities/' + this.communityId, { replace: replace });
    return this;
  },

  loadCommunityData: function () {
    // get meta data for community
    $.ajax({
      url: '/api/admin/community/' + this.communityId,
      dataType: 'json',
      success: function (communityInfo) {
        var template = _.template(AdminCommunityTemplate)({
          community: communityInfo,
          communities: this.options.communities,
        });
        this.$el.html(template);
        if(this.options.communities) {
          this.initializeCommunitySelect();
        }
      }.bind(this),
    });
  },

  initializeCommunitySelect: function () {
    setTimeout(function () {
      $('#communities').select2({
        placeholder: 'Select a community',
        allowClear: false,
      });
      try {
        $('#s2id_communities').children('.select2-choice').children('.select2-search-choice-close').remove();
      } catch (error) { /* swallow exception because close image has already been removed*/ }
    }, 50);
  },

  changeCommunity: function (event) {
    Backbone.history.navigate('/admin/communities/' + $('#communities').val(), { trigger: true });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityView;
