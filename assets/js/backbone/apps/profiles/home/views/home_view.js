var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var ActivityCollection = window.c = require('../../../../entities/activities/activities_collection');
var TaskCollection = require('../../../../entities/tasks/tasks_collection');
var UIConfig = require('../../../../config/ui.json');
var User = require('../../../../../utils/user');

// templates
var TaskListView = require('../../../tasks/list/views/task_list_view');
var TasksCollection = require('../../../../entities/tasks/tasks_collection');
var HomeTemplate = require('../templates/home_template.html');
var SearchTemplate = require('../templates/home_search_template.html');
var UsersTemplate = require('../templates/home_users_feed_template.html');
var HomeCreatedTemplate = require('../templates/home_created_template.html');
var HomeParticipatedTemplate = require('../templates/home_participated_template.html');

var templates = {
  main: _.template(HomeTemplate),
  users: _.template(UsersTemplate),
  search: _.template(SearchTemplate),
  created: _.template(HomeCreatedTemplate),
  // participated: _template(HomeParticipatedTemplate)
};

var HomeView = Backbone.View.extend({
  events: {
    'click .logout' : 'logout',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
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


    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    $.ajax('/api/user/activities/' + this.data.id).done(function (data) {
      this.taskView = new HomeActivityView({
        model: this.model,
        el: '.task-createdactivity-wrapper',
        template: created,
        target: 'task',
        handle: 'task',  // used in css id
        data: data.tasks.created,
      });
      this.taskView.render();
      this.volView = new HomeActivityView({
        model: this.model,
        el: '.task-activity-wrapper',
        template: participated,
        target: 'task',
        handle: 'volTask',  // used in css id
        data: data.tasks.volunteered,
        getStatus: this.getStatus,
      });
      this.volView.render();
    }.bind(this));


    this.$el.localize();

    // // initialize sub components
    // this.initializeHomeActivityView();

    return this;
  },

  setTarget: function (target, inner) {
    var s = '[data-target=' + target + ']';
    $(s).html(inner);
  },

  // initializeHomeActivityView: function () {
  //   if (this.taskView) { this.taskView.cleanup(); }
  //   if (this.volView) { this.volView.cleanup(); }
  //   $.ajax('/api/user/activities/' + this.model.attributes.id).done(function (data) {
  //     this.taskView = new HomeActivityView({
  //       model: this.model,
  //       el: '.task-createdactivity-wrapper',
  //       template: HomeCreatedTemplate,
  //       target: 'task',
  //       handle: 'task',  // used in css id
  //       data: data.tasks.created,
  //     });
  //     this.taskView.render();
  //     this.volView = new HomeActivityView({
  //       model: this.model,
  //       el: '.task-activity-wrapper',
  //       template: HomeParticipatedTemplate,
  //       target: 'task',
  //       handle: 'volTask',  // used in css id
  //       data: data.tasks.volunteered,
  //       getStatus: this.getStatus,
  //     });
  //     this.volView.render();
  //   }.bind(this));
  // },

  logout: function (e) {
    if (e.preventDefault) e.preventDefault();
    $.ajax({
      url: '/api/auth/logout?json=true',
    }).done(function (success) {
      window.cache.currentUser = null;
      window.cache.userEvents.trigger('user:logout');
    }).fail(function (error) {
      // do nothing
    });
  },

  cleanup: function () {
    this.$el.removeClass('home');
    removeView(this);
  },
});

module.exports = HomeView;
