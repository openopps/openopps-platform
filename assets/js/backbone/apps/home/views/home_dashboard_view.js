var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var ActivityCollection = window.c = require('../../../entities/activities/activities_collection');
var TaskCollection = require('../../../entities/tasks/tasks_collection');
var UIConfig = require('../../../config/ui.json');
var User = require('../../../../utils/user');

// templates
var TaskListView = require('../../tasks/list/views/task_list_view');
var TasksCollection = require('../../../entities/tasks/tasks_collection');
var DashboardTemplate = require('../templates/home_dashboard_template.html');
var AnnouncementTemplate = require('../templates/home_announcement_template.html');
var SearchTemplate = require('../templates/home_search_template.html');
var UsersTemplate = require('../templates/home_users_feed_template.html');
var AchievementsTemplate = require('../templates/home_achievements_template.html');

var templates = {
  main: _.template(DashboardTemplate),
  announcement: _.template(AnnouncementTemplate),
  users: _.template(UsersTemplate),
  search: _.template(SearchTemplate),
  achievements: _.template(AchievementsTemplate),
};

var DashboardView = Backbone.View.extend({
  el: '#container',
  initialize: function (options) {
    this.options = options;
    this.queryParams = {};
    this.initializeView();
    return this;
  },

  initializeView: function () {
    if (this.taskListView) {
      this.taskListView.cleanup();
    }
    this.taskListView = new TaskListView({
      el: '#task-list',
      collection: this.collection,
      queryParams: this.queryParams,
    });
  },

  render: function () {
    $('#search-results-loading').hide();
    this.$el.html(templates.main());
    
    _.each(['search', 'users'], function (type) {
      this.listenTo(new ActivityCollection({ type: type }), 'activity:collection:fetch:success', function (e) {
        var data = {};
        data[type] = e.toJSON()[0];
        var html = templates[type](data);
        this.setTarget(type + '-feed', html);
      }.bind(this));
    }.bind(this));

    this.listenTo(new ActivityCollection({ type: 'badges' }), 'activity:collection:fetch:success', function  (e) {
      var bs = e.toJSON().filter(function (b) {     
        return b.participants.length > 0;
      });
      
      var achievementsHtml = templates.achievements({ achievements: bs });
      this.setTarget('achievements-feed', achievementsHtml);
    }.bind(this));
    
    $.ajax({
      url: '/api/announcement',
      dataType: 'json',
      success: function (announcementInfo) {
        announcementHtml = templates.announcement(announcementInfo);
        this.setTarget('announcement-feed', announcementHtml);
      }.bind(this),
    });

    this.$el.localize();
    return this;
  },

  setTarget: function (target, inner) {
    var s = '[data-target=' + target + ']';
    $(s).html(inner);
  },

  cleanup: function () {
    this.$el.removeClass('home');
    removeView(this);
  },
});

module.exports = DashboardView;
