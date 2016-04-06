
var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../../../mixins/utilities');
var AdminUserView = require('./admin_user_view');
var AdminTagView = require('./admin_tag_view');
var AdminTaskView = require('./admin_task_view');
var AdminAgenciesView = require('./admin_agencies_view');
var AdminParticipantsView = require('./admin_participants_view');
var AdminDashboardView = require('./admin_dashboard_view');
var AdminMainTemplate = require('../templates/admin_main_template.html');


var AdminMainView = Backbone.View.extend({

  events: {
    'click .link-admin'             : 'link'
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var data = {};
    var template = _.template(AdminMainTemplate)(data);
    this.$el.html(template);
    this.routeTarget(this.options.action || '');
    return this;
  },

  isAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAdmin);
  },

  isAgencyAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAgencyAdmin);
  },

  routeTarget: function (target) {
    if (!target) {
      target = 'dashboard';
    }
    // If agency admin, display My Agency page
    if (!this.isAdmin() && this.isAgencyAdmin()) {
      target = 'agencies';
    }
    var t = $((this.$("[data-target=" + target + "]"))[0]);
    // remove active classes
    $($(t.parents('ul')[0]).find('li')).removeClass('active');
    // make the current link active
    $(t.parent('li')[0]).addClass('active');
    if (target == 'user') {
      if (!this.adminUserView) {
        this.initializeAdminUserView();
      }
      this.hideOthers();
      this.adminUserView.render();
    } else if (target == 'tag') {
      if (!this.adminTagView) {
        this.initializeAdminTagView();
      }
      this.hideOthers();
      this.adminTagView.render();
    } else if (target == 'tasks') {
      if (!this.adminTaskView) {
        this.initializeAdminTaskView();
      }
      this.hideOthers();
      this.adminTaskView.render();
    } else if (target == 'agencies') {
      if (!this.adminAgenciesView) {
        this.initializeAdminAgenciesView();
      }
      this.hideOthers();
      this.adminAgenciesView.render();
    } else if (target == 'participants') {
      if (!this.adminParticipantsView) {
        this.initializeAdminParticipantsView();
      }
      this.hideOthers();
      this.adminParticipantsView.render();
    } else if (target == 'dashboard') {
      if (!this.adminDashboardView) {
        this.initializeAdminDashboardView();
      }
      this.hideOthers();
      this.adminDashboardView.render();
    }
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.routeTarget(t.data('target'));
  },

  hideOthers: function () {
    this.$(".admin-container").hide();
  },

  initializeAdminUserView: function () {
    if (this.adminUserView) {
      this.adminUserView.cleanup();
    }
    this.adminUserView = new AdminUserView({
      el: "#admin-user"
    });
  },

  initializeAdminTagView: function () {
    if (this.adminTagView) {
      this.adminTagView.cleanup();
    }
    this.adminTagView = new AdminTagView({
      el: "#admin-tag"
    });
  },

  initializeAdminTaskView: function () {
    if (this.adminTaskView) {
      this.adminTaskView.cleanup();
    }
    this.adminTaskView = new AdminTaskView({
      el: "#admin-task"
    });
  },

  initializeAdminAgenciesView: function () {
    if (this.adminAgenciesView) {
      this.adminAgenciesView.cleanup();
    }
    this.adminAgenciesView = new AdminAgenciesView({
      el: "#admin-agencies"
    });
  },

  initializeAdminParticipantsView: function () {
    if (this.adminParticipantsView) {
      this.adminParticipantsView.cleanup();
    }
    this.adminParticipantsView = new AdminParticipantsView({
      el: "#admin-participants"
    });
  },

  initializeAdminDashboardView: function () {
    if (this.adminDashboardView) {
      this.adminDashboardView.cleanup();
    }
    this.adminDashboardView = new AdminDashboardView({
      el: "#admin-dashboard"
    });
  },

  cleanup: function () {
    if (this.adminUserView) this.adminUserView.cleanup();
    if (this.adminTagView) this.adminTagView.cleanup();
    if (this.adminTaskView) this.adminTaskView.cleanup();
    if (this.adminDashboardView) this.adminDashboardView.cleanup();
    removeView(this);
  },
});

module.exports = AdminMainView;
