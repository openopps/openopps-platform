var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var ActivityCollection = window.c = require('../../../entities/activities/activities_collection');
var TaskCollection = require('../../../entities/tasks/tasks_collection');
var UIConfig = require('../../../config/ui.json');

// templates
var fs = require('fs');
var BrowseMainView = require('../../browse/views/browse_main_view');
var BrowseListView = require('../../browse/views/browse_list_view');
var TasksCollection = require('../../../entities/tasks/tasks_collection');
var DashboardTemplate = fs.readFileSync(`${__dirname}/../templates/home_dashboard_template.html`).toString();
var BadgesTemplate = fs.readFileSync(`${__dirname}/../templates/home_badges_feed_template.html`).toString();
var UsersTemplate = fs.readFileSync(`${__dirname}/../templates/home_users_feed_template.html`).toString();
var NetworkTemplate = fs.readFileSync(`${__dirname}/../templates/home_network_stats_template.html`).toString();

var templates = {
  main: _.template(DashboardTemplate),
  badges: _.template(BadgesTemplate),
  users: _.template(UsersTemplate),
  network: _.template(NetworkTemplate),
};

var DashboardView = Backbone.View.extend({
  el: '#container',
  initialize: function (options) {
    this.options = options;
    this.queryParams = {};
    this.fireUpCollection();
    this.initializeView();
    this.collection.trigger('browse:fetch');
    return this;
  },

  initializeView: function () {
    if (this.browseMainView) {
      this.browseMainView.cleanup();
    }
    this.browseMainView = new BrowseMainView({
      el: '#container',
      target: 'tasks',
      collection: this.collection,
      queryParams: this.queryParams,
    }).render();
  },

  fireUpCollection: function () {
    var self = this;
    this.collection = new TasksCollection();
    this.listenToOnce(this.collection, 'browse:task:fetch', function () {
      self.collection.fetch({
        success: function (collection) {
          var userAgency;
          self.collection = collection;
          self.browseMainView.collection = collection;
          if (window.cache.currentUser) {
            userAgency = _.where(window.cache.currentUser.tags, { type: 'agency' })[0];
          }
          self.browseMainView.filter( undefined, { state: 'open' }, userAgency );
        },
      });
    });
  },

  render: function () {
    var self            = this,
      badges          = new ActivityCollection({ type: 'badges' }),
      users           = new ActivityCollection({ type: 'users' }),
      tasks           = new TaskCollection();

    this.$el.html(templates.main());

    /*
     * Listen for badges. This callback function uses Backbone's trigger method
     * to retrieve the badges information whenever the ActivityCollection is
     * fetched successfully.
     * @param ActivityCollection | An activity collection.
     * @param String             | A Backbone event string to bind to..
     * @param Function           | A callback function containing the event data.
     * @see   /assets/js/backbone/entities/activities/activities_collection.js
     */
    this.listenTo( badges, 'activity:collection:fetch:success', function ( e ) {

      var bs = e.toJSON().filter( function ( b ) {
        return b.participants.length > 0;
      } );

      var badgesHtml = templates.badges( { badges: bs } );

      self.setTarget( 'badges-feed', badgesHtml );

    } );

    this.listenTo(users, 'activity:collection:fetch:success', function (e) {
      var data = { users: e.toJSON() },
        usersHtml = templates.users(data);
      self.setTarget('users-feed', usersHtml);
    });

    $.ajax({
      url: '/api/activity/count',
      data: { where: { state: 'completed' }},
      success: function (d) {
        var html = templates.network({ count: d });
        self.setTarget('network-stats', html);
      },
      error: function (err) {
        console.log('err with /api/activity/count\n', err);
      },
    });

    $.ajax({
      url: '/api/activity/count',
      data: { where: { state: 'open' }},
      success: function (d) {
        self.$('#opportunity-count span')
            .addClass('loaded')
            .text(d);
      },
      error: function (err) {
        console.log('err with /api/activity/count\n', err);
      },
    });


    var collection = this.collection.chain().pluck('attributes').filter(function (item) {
      // filter out tasks that are full time details with other agencies
      var userAgency = { id: false },
        timeRequiredTag = _.where(item.tags, { type: 'task-time-required' })[0],
        fullTimeTag = false;

      if (window.cache.currentUser) {
        userAgency = _.where(window.cache.currentUser.tags, { type: 'agency' })[0];
      }

      if (timeRequiredTag && timeRequiredTag.name === 'Full Time Detail') {
        fullTimeTag = true;
      }

      if (!fullTimeTag) return item;
      if (fullTimeTag && userAgency && (timeRequiredTag.data.agency.id === userAgency.id)) return item;
    }).filter(function (data) {
      var searchBody = JSON.stringify(_.values(data)).toLowerCase();
      return !term || searchBody.indexOf(term.toLowerCase()) >= 0;
    }).filter(function (data) {
      var test = [];
      _.each(filters, function (value, key) {
        if (_.isArray(value)) {
          test.push(_.some(value, function (val) {
            return data[key] === val || _.contains(data[key], value);
          }));
        } else {
          test.push(data[key] === value || _.contains(data[key], value));
        }
      });
      return test.length === _.compact(test).length;
    }).value();

    this.browseListView = new BrowseListView({
      el: '#browse-list',
      target: 'project',
      collection: collection,
    });

    if (this.collection.length == 0) {
        $('.dashboard__task-list').hide();
    }

    // TODO: this.$el.localize();
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
