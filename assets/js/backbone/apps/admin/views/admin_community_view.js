var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminCommunityTemplate = require('../templates/admin_community_template.html');
var AdminCommunityView = Backbone.View.extend({

  events: {
    'change #communities': 'changeCommunity',
    'click #community-edit': linkBackbone,
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.communityId = options.communityId || options.communities[0].communityId;
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData();
    //this.loadInteractionsData();
    $('#search-results-loading').hide();
    Backbone.history.navigate('/admin/community/' + this.communityId, { replace: replace });
    return this;
  },

  loadCommunityData: function () {
    // get meta data for community
    $.ajax({
      url: '/api/admin/community/' + this.communityId,
      dataType: 'json',
      success: function (communityInfo) {
        this.loadInteractionsData(function (interactions) {
          communityInfo.interactions = interactions;
          var template = _.template(AdminCommunityTemplate)({
            community: communityInfo,
            communities: this.options.communities,
          });
          this.$el.html(template);
          if(this.options.communities) {
            this.initializeCommunitySelect();
          }
        }.bind(this));
      }.bind(this),
    });
  },
  
  loadInteractionsData: function (callback) {
    $.ajax({
      url: '/api/admin/community/interactions/' + this.communityId,
      dataType: 'json',
      success: function (interactions) {
        interactions.count = _(interactions).reduce(function (sum, value, key) {
          return sum + value;
        }, 0);
        callback(interactions);
      },
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
    if($('#communities').val()) {
      Backbone.history.navigate('/admin/community/' + $('#communities').val(), { trigger: true });
    }
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityView;
