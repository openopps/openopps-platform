var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminCommunityTemplate = require('../templates/admin_community_template.html');
var AdminCommunityDashboardActivitiesTemplate = require('../templates/admin_community_dashboard_activities_template.html');
var AdminCommunityView = Backbone.View.extend({

  events: {
    'change #communities'         : 'changeCommunity',
    'click #community-edit'       : linkBackbone,
    'click .usajobs-alert__close' : 'closeAlert',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.communityId = options.communityId || options.communities[0].communityId;
    this.params = new URLSearchParams(window.location.search);
  },

  render: function (replace) {
    var self = this;
    this.$el.show();
    this.loadCommunityData();
    //this.loadInteractionsData();
    $('#search-results-loading').hide();
    Backbone.history.navigate('/admin/community/' + this.communityId, { replace: replace });
    return this;
  },

  closeAlert: function (event) {
    $(event.currentTarget).closest('.usajobs-alert').hide();
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
            updateSuccess: this.params.has('updateSuccess'),
            saveSuccess:this.params.has('saveSuccess'),
          });
          this.$el.html(template);
          setTimeout(function () {
            this.fetchData(this);
          }.bind(this), 50);
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

  renderActivities: function (self, data) {
    var template = _.template(AdminCommunityDashboardActivitiesTemplate)(data);
    self.$('.activity-block').html(template);
    _(data).forEach(function (activity) {

      if (!activity || !activity.user ||
        (activity.type === 'newVolunteer' && !activity.task) ||
        (activity.comment && typeof activity.comment.value === 'undefined')
      ) return;

      if (activity.comment) {
        var value = activity.comment.value;

        value = marked(value, { sanitize: false });
        //render comment in single line by stripping the markdown-generated paragraphs
        value = value.replace(/<\/?p>/gm, '');
        value = value.replace(/<br>/gm, '');
        value = value.trim();

        activity.comment.value = value;
      }

      activity.createdAtFormatted = $.timeago(activity.createdAt);
      var template = self.$('#' + activity.type).text(),
          content = _.template(template, { interpolate: /\{\{(.+?)\}\}/g })(activity);
      self.$('.activity-block .activity-feed').append(content);
    });

    this.$el.localize();
    self.$('.spinner').hide();
  },

  fetchData: function (self) {
    $.ajax({
      url: '/api/admin/community/'+ this.communityId + '/activities',
      dataType: 'json',
      success: function (activityData) {
        self.renderActivities(self, activityData);
      }.bind(this),
    });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityView;
