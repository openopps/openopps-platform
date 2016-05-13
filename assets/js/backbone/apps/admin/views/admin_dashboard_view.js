var _ = require('underscore');
var Backbone = require('backbone');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');

var ModalComponent = require('../../../components/modal');
var LoginConfig = require('../../../config/login.json');
var marked = require('marked');

// templates
var fs = require('fs');
var AdminDashboardTemplate = fs.readFileSync(`${__dirname}/../templates/admin_dashboard_template.html`).toString();
var AdminDashboardTable = fs.readFileSync(`${__dirname}/../templates/admin_dashboard_table.html`).toString();
var AdminDashboardTasks = fs.readFileSync(`${__dirname}/../templates/admin_dashboard_task_metrics.html`).toString();
var AdminDashboardActivities = fs.readFileSync(`${__dirname}/../templates/admin_dashboard_activities.html`).toString();

var AdminDashboardView = Backbone.View.extend({

  events: {
    'change .group': 'renderTasks',
    'change .filter': 'renderTasks'
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1
    };
  },

  render: function () {
    var self = this;
    Backbone.history.navigate('/admin/dashboard');
    this.$el.show();
    if (this.rendered === true) {
      return this;
    }
    var data = {
      user: window.cache.currentUser,
      login: LoginConfig
    };
    var template = _.template(AdminDashboardTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    // fetch data
    this.fetchData(self, this.data);
    return this;
  },

  renderMetrics: function (self, data) {
    var template = _.template(AdminDashboardTable)(data);
    self.$(".metric-block").html(template);
    this.$el.localize();
    // hide spinner and show results
    self.$(".spinner").hide();
    self.$(".metric-block").show();
  },

  renderTasks: function() {
    var self = this,
        data = this.data,
        group = this.$('.group').val() || 'fy',
        filter = this.$('.filter').val() || '',
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function label(key) {
      if (key === 'undefined') return 'No date';
      return group === 'week' ? 'W' + (+key.slice(4)) + '\n' + key.slice(0,4):
        group === 'month' ? months[key.slice(4) - 1]  + '\n' + key.slice(0,4) :
        group === 'quarter' ? 'Q' + (+key.slice(4)) + '\n' + key.slice(0,4) :
        group === 'fyquarter' ? 'Q' + (+key.slice(4)) + '\nFY' + key.slice(0,4) :
        group === 'fy' ? 'FY' + key : key;
    }

    $.ajax({
      url: '/api/admin/taskmetrics?group=' + group + '&filter=' + filter,
      dataType: 'json',
      success: function (data) {
        data.label = label;
        var template = _.template(AdminDashboardTasks)(data);
        data.tasks.active = self.data.tasks;
        self.$(".task-metrics").html(template);
        self.$el.localize();
        // hide spinner and show results
        self.$(".spinner").hide();
        self.$(".task-metrics").show();
        self.$('.group').val(group);
        self.$('.filter').val(filter);
      }
    });
  },

  renderActivities: function (self, data) {
    var template = _.template(AdminDashboardActivities);
    self.$(".activity-block").html(template);
    _(data).forEach(function(activity) {

      // If activity is missing data, skip it
      if (!activity || !activity.user ||
        (activity.type === 'newVolunteer' && !activity.task) ||
        (activity.comment && typeof activity.comment.value === "undefined")
       ) return;

      // Render markdown
      if (activity.comment) {
        var value = activity.comment.value;

        value = marked(value, { sanitize: false });
        //render comment in single line by stripping the markdown-generated paragraphs
        value = value.replace(/<\/?p>/gm, '');
        value = value.replace(/<br>/gm, '');
        value = value.trim();

        activity.comment.value = value;
      }
      // Format timestamp
      activity.createdAtFormatted = $.timeago(activity.createdAt);
      var template = self.$('#' + activity.type).text(),
          content = _.template(template, { interpolate: /\{\{(.+?)\}\}/g })(activity);
      self.$('.activity-block .activity-feed').append(content);
    });

    this.$el.localize();
    // hide spinner and show results
    self.$(".spinner").hide();
    self.$(".activity-block").show();
    self.renderTasks(self, this.data);
  },

  fetchData: function (self, data) {
    $.ajax({
      url: '/api/admin/metrics',
      dataType: 'json',
      success: function (data) {
        self.data = data;
        $.ajax({
          url: '/api/admin/interactions',
          dataType: 'json',
          success: function(interactions) {
            data.interactions = interactions;
            interactions.count = _(interactions).reduce(function(sum, value, key) {
              return sum + value;
            }, 0);
            self.renderMetrics(self, data);
          }
        });
      }
    });
    $.ajax({
      url: '/api/admin/activities',
      dataType: 'json',
      success: function (data) {
        self.renderActivities(self, data);
      }
    });
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminDashboardView;
