var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

var ActivityCollection = window.c = require('../../../entities/activities/activities_collection');
var TaskCollection = require('../../../entities/tasks/tasks_collection');
var UIConfig = require('../../../config/ui.json');

// templates
var fs = require('fs');
var DashboardTemplate = fs.readFileSync(`${__dirname}/../templates/home_dashboard_template.html`).toString();
var BadgesTemplate = fs.readFileSync(`${__dirname}/../templates/home_badges_feed_template.html`).toString();
var UsersTemplate = fs.readFileSync(`${__dirname}/../templates/home_users_feed_template.html`).toString();
var NetworkTemplate = fs.readFileSync(`${__dirname}/../templates/home_network_stats_template.html`).toString();

var templates = {
  main: _.template(DashboardTemplate),
  badges: _.template(BadgesTemplate),
  users: _.template(UsersTemplate),
  network: _.template(NetworkTemplate)
};

var DashboardView = Backbone.View.extend({
  el: "#container",
  initialize: function (options) {
    this.options = options;

    return this;
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

      var bs = e.toJSON().filter( function( b ) {
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
      }
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
      }
    });

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
