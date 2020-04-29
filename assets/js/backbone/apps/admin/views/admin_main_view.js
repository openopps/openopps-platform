
var _ = require('underscore');
var Backbone = require('backbone');

var AdminUserView = require('./admin_user_view');
var AdminUserDetailsView = require('./admin_user_details_view');
var AdminCommunityCycleView = require('./admin_community_cycle_view');
var AdminCommunityApplicantView = require('./admin_community_applicant_view');
var AdminCommunityApplicantSubmittedView = require('./admin_community_applicant_submitted_view');
var AdminTaskView = require('./admin_task_view');
var AdminAgenciesView = require('./admin_agencies_view');
var AdminDashboardView = require('./admin_dashboard_view');
var AdminCommunityView = require('./admin_community_view');
var AdminCommunityEditView = require('./admin_community_edit_view');
var NavSecondaryView = require('./nav_secondary_view');

var AdminMainTemplate = require('../templates/admin_main_template.html');

var AdminMainView = Backbone.View.extend({
  events: {
    'click .usajobs-nav-secondary__item'  : 'link',
    'click #more-menu'                    : 'moreMenuToggle',
    'click .usajobs-nav-secondary__more-container .usajobs-nav-secondary__item' : 'moreMenuToggle',
    'click .admin-manage-link'            : linkBackbone,
    'click #user-back'                    : linkBackbone,
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var data = {};
    var template = _.template(AdminMainTemplate)(data);
    this.$el.html(template);
    this.routeTarget(this.options.action || '', this.options.agencyId, this.options.communityId, true);
    return this;
  },

  isAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAdmin);
  },

  isApprover: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isApprover);
  },

  isAgencyAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isAgencyAdmin);
  },

  userAgencyId: function () {
    return (window.cache.currentUser
              && window.cache.currentUser.agency
              && window.cache.currentUser.agency.agencyId);
  },

  isCommunityAdmin: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isCommunityAdmin);
  },

  isCommunityApprover: function () {
    return !!(window.cache.currentUser && window.cache.currentUser.isCommunityApprover);
  },

  routeTarget: function (target, agencyId, communityId, replace) {
    if (!target) {
      target = 'sitewide';
    }

    // If agency admin, display My Agency page
    if (target == 'sitewide' && !this.isAdmin() && !this.isApprover() && this.isAgencyAdmin()) {
      this.hideDashboardMenu();
      agencyId = this.userAgencyId();   // restrict access to User agency
      target = 'agency';
    } else if (target == 'sitewide' && !this.isAdmin() && !this.isApprover() && (this.isCommunityAdmin() || this.isCommunityApprover())) {
      this.hideDashboardMenu();
      target = 'community';
    }

    var t = $((this.$('[data-target=' + target + ']'))[0]);
    // remove active classes
    $('.usajobs-nav-secondary__item.is-active').removeClass('is-active');
    t.addClass('is-active');
    
    this.initializeNavSecondaryView();

    this.hideOthers();
    if(this.options.subAction) {
      switch (this.options.subAction) {
        case 'users':
          this.initializeAdminUserView(target, this.options[target + 'Id']);
          this.adminUserView.render();
          break;
        case 'user-details': {
          this.initializeAdminUserDetailsView(this.options[target + 'Id']);
          break;
        }
        case 'cycles':
          this.initializeAdminCommunityCycleView(target, this.options[target + 'Id']);
          this.adminCommunityCycleView.render();
          break;
        case 'edit':
          this.initializeAdminEdit(target, this.options[target + 'Id']);
          break;
        case 'tasks':
          this.initializeAdminTaskView(target, this.options[target + 'Id']);
          this.adminTaskView.render();
          break;
        case 'applicants':
          this.initializeAdminCommunityApplicantView(target, this.options[target + 'Id']);
          this.adminCommunityApplicantView.render();
          break;
      
        default:
          break;
      }
    } else {
      switch (target) {
        case 'users':
          this.initializeAdminUserView('sitewide');
          this.adminUserView.render();
          break;
        case 'tasks':
          this.initializeAdminTaskView('sitewide');
          this.adminTaskView.render();
          break;
        case 'agency':
          this.initializeAdminAgenciesView(agencyId, replace);
          break;
        case 'sitewide':
          this.initializeAdminDashboardView();
          this.adminDashboardView.render(replace);
          break;
        case 'community':
          this.initializeAdminCommunityView(communityId, replace);
          break;
        default:
          break;
      }
    }
  },

  initializeAdminEdit: function (target, targetId) {
    switch (target) {
      case 'community':
        this.initializeAdminCommunityEditView(targetId);
        break;
      default:
        break;
    }
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    delete this.options.subAction;
    this.routeTarget(t.data('target'));
  },

  hideOthers: function () {
    this.$('.admin-container').hide();
  },

  hideDashboardMenu: function () {
    this.$('.dashboard-menu').hide();
  },

  initializeAdminUserView: function (target, targetId) {
    if (this.adminUserView) {
      this.adminUserView.cleanup();
    }
    this.adminUserView = new AdminUserView({
      el: '#admin-user',
      target: target,
      targetId: targetId,
    });
  },

  c: function (target, targetId) {
    if (this.adminCommunityCycleView) {
      this.adminCommunityCycleView.cleanup();
    }
    this.adminCommunityCycleView = new AdminCommunityCycleView({
      el: '#admin-cycle',
      target: target,
      targetId: targetId,
    });
  },
  
  initializeAdminCommunityApplicantView: function (target, targetId) {
    if (this.adminCommunityApplicantView) {
      this.adminCommunityApplicantView.cleanup();
    }
    this.adminCommunityApplicantView = new AdminCommunityApplicantView({
      el: '#admin-applicant',
      target: target,
      targetId: targetId,
    });
  },

  initializeAdminCommunityEditView: function (targetId) {
    if (this.adminCommunityEditView) {
      this.adminCommunityEditView.cleanup();
    }
    this.adminCommunityEditView = new AdminCommunityEditView({
      el: '#main-content',
      communityId: targetId,
    });
    this.adminCommunityEditView.render();
  },

  initializeAdminTaskView: function (target, targetId) {
    if (this.adminTaskView) {
      this.adminTaskView.cleanup();
    }
    this.adminTaskView = new AdminTaskView({
      el: '#admin-task',
      target: target,
      targetId: targetId,
    });
  },

  initializeAdminUserDetailsView: function (targetId) {
    this.adminUserDetailsView && this.adminUserDetailsView.cleanup();

    this.adminUserDetailsView = new AdminUserDetailsView({
      el: '#admin-user-details',
      userId: targetId,
    });
    this.adminUserDetailsView.render();
  },

  initializeAdminAgenciesView: function (agencyId, replace) {
    this.adminAgenciesView && this.adminAgenciesView.cleanup();
    var callback = function (departments) {
      this.adminAgenciesView = new AdminAgenciesView({
        el: '#admin-main',
        agencyId: agencyId,
        adminMainView: this,
        departments: departments,
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
      callback.bind(this)();
    }
  },

  initializeAdminDashboardView: function () {
    if (this.adminDashboardView) {
      this.adminDashboardView.cleanup();
    }
    this.adminDashboardView = new AdminDashboardView({
      el: '#admin-main',
    });
  },

  initializeAdminCommunityView: function (communityId, replace) {
    this.adminCommunityView && this.adminCommunityView.cleanup();
    var callback = function (communities) {
      this.adminCommunityView = new AdminCommunityView({
        el: '#admin-main',
        communityId: communityId,
        adminMainView: this,
        communities: communities,
      });
      this.adminCommunityView.render(replace);
    };
    if(this.isAdmin() || this.isCommunityAdmin() || this.isCommunityApprover()) {
      $.ajax({
        url: '/api/admin/communities',
        dataType: 'json',
        success: callback.bind(this),
      });
    } else {
      callback();
    }
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
    this.adminUserView && this.adminUserView.cleanup();
    this.adminTagView && this.adminTagView.cleanup();
    this.adminTaskView && this.adminTaskView.cleanup();
    this.adminDashboardView && this.adminDashboardView.cleanup();
    this.navSecondaryView && this.navSecondaryView.cleanup();
    this.adminAgenciesView && this.adminAgenciesView.cleanup();
    this.adminCommunityView && this.adminCommunityView.cleanup();
    removeView(this);
  },
});

module.exports = AdminMainView;
