
var _ = require('underscore');
var Backbone = require('backbone');

var AdminUserView = require('./admin_user_view');
var AdminTagView = require('./admin_tag_view');
var AdminTaskView = require('./admin_task_view');
var AdminAgenciesView = require('./admin_agencies_view');

var AdminParticipantsView = require('./admin_participants_view');
var AdminDashboardView = require('./admin_dashboard_view');
var AdminCommunityView = require('./admin_community_view');
var NavSecondaryView = require('./nav_secondary_view');

// templates
var AdminMainTemplate = require('../templates/admin_main_template.html');

var AdminMainView = Backbone.View.extend({

  events: {
    'click .usajobs-nav-secondary__item'  : 'link',
    'click #more-menu'                    : 'moreMenuToggle',
    'click .usajobs-nav-secondary__more-container .usajobs-nav-secondary__item' : 'moreMenuToggle',
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var data = {};
    var template = _.template(AdminMainTemplate)(data);
    this.$el.html(template);
    this.routeTarget(this.options.action || '', undefined, true);
    return this;
  },

  isAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAdmin);
  },

  isAgencyAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAgencyAdmin);
  },

  userAgencyId: function () {
    return (window.cache.currentUser
              && window.cache.currentUser.agency
              && window.cache.currentUser.agency.id);
  },

  routeTarget: function (target, agencyId, replace) {
    agencyId = agencyId || this.options.agencyId;
    if (!target) {
      target = 'sitewide';
    }

    // If agency admin, display My Agency page
    if (!this.isAdmin() && this.isAgencyAdmin()) {
      this.hideDashboardMenu();
      agencyId = this.userAgencyId();   // restrict access to User agency
      if (target == 'sitewide') target = 'agencies';
    }
    var t = $((this.$('[data-target=' + target + ']'))[0]);
    // remove active classes
    $('.usajobs-nav-secondary__item.is-active').removeClass('is-active');
    t.addClass('is-active');
    
    this.initializeNavSecondaryView();

    this.hideOthers();
    switch (target) {
      case 'users':
        this.initializeAdminUserView(agencyId);
        this.adminUserView.render();
        break;
      case 'tag':
        this.initializeAdminTagView();
        this.adminTagView.render();
        break;
      case 'tasks':
        this.initializeAdminTaskView(agencyId);
        this.adminTaskView.render();
        break;
      case 'agencies':
        this.initializeAdminAgenciesView(agencyId, replace);
        break;
      case 'participants':
        this.initializeAdminParticipantsView();
        this.adminParticipantsView.render();
        break;
      case 'sitewide':
        this.initializeAdminDashboardView();
        this.adminDashboardView.render(replace);
        break;
      // case 'community':
      //   this.initializeAdminCommunityView();
      //   this.adminCommunityView.render(replace);
      //   break;
      default:
        break;
    }
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.routeTarget(t.data('target'));
  },

  hideOthers: function () {
    this.$('.admin-container').hide();
  },

  hideDashboardMenu: function () {
    this.$('.dashboard-menu').hide();
  },

  initializeAdminUserView: function (agencyId) {
    if (this.adminUserView) {
      this.adminUserView.cleanup();
    }
    this.adminUserView = new AdminUserView({
      el: '#admin-user',
      agencyId: agencyId,
    });
  },

  initializeAdminTagView: function () {
    if (this.adminTagView) {
      this.adminTagView.cleanup();
    }
    this.adminTagView = new AdminTagView({
      el: '#admin-tag',
    });
  },

  initializeAdminTaskView: function (agencyId) {
    if (this.adminTaskView) {
      this.adminTaskView.cleanup();
    }
    this.adminTaskView = new AdminTaskView({
      el: '#admin-task',
      agencyId: agencyId,
    });
  },

  initializeAdminAgenciesView: function (agencyId, replace) {
    this.adminAgenciesView && this.adminAgenciesView.cleanup();
    var callback = function (agencies) {
      this.adminAgenciesView = new AdminAgenciesView({
        el: '#admin-agencies',
        agencyId: agencyId,
        adminMainView: this,
        agencies: agencies,
      });
      this.adminAgenciesView.render(replace);
    };
    if(this.isAdmin()) {
      $.ajax({
        url: '/api/admin/agencies',
        dataType: 'json',
        success: callback.bind(this),
      });
    } else {
      callback();
    }
  },

  initializeAdminParticipantsView: function () {
    if (this.adminParticipantsView) {
      this.adminParticipantsView.cleanup();
    }
    this.adminParticipantsView = new AdminParticipantsView({
      el: '#admin-participants',
    });
  },

  initializeAdminDashboardView: function () {
    if (this.adminDashboardView) {
      this.adminDashboardView.cleanup();
    }
    this.adminDashboardView = new AdminDashboardView({
      el: '#admin-sitewide',
    });
  },

  initializeAdminCommunityView: function () {
    if (this.adminCommunityView) {
      this.adminCommunityView.cleanup();
    }
    this.adminCommunityView = new AdminCommunityView({
      el: '#admin-community',
    });
  },

  initializeNavSecondaryView: function () {
    if (this.navSecondaryView) {
      this.navSecondaryView.cleanup();
    }
    this.navSecondaryView = new NavSecondaryView ({

    }).render();
  },

  moreMenuToggle: function (event) {
    if(event.preventDefault) event.preventDefault();
    if (this.navSecondaryView) {
      this.navSecondaryView.menuToggle(event.currentTarget);
    }
  },

  cleanup: function () {
    if (this.adminUserView) this.adminUserView.cleanup();
    if (this.adminTagView) this.adminTagView.cleanup();
    if (this.adminTaskView) this.adminTaskView.cleanup();
    if (this.adminDashboardView) this.adminDashboardView.cleanup();
    if (this.navSecondaryView) this.navSecondaryView.cleanup();
    removeView(this);
  },
});

module.exports = AdminMainView;
