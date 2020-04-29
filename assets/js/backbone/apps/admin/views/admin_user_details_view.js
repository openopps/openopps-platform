var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var MarkdownEditor = require('../../../components/markdown_editor');
var AdminUserDetailsTemplate = require('../templates/admin_user_details_template.html');
var Modal = require('../../../components/modal');

var AdminUserDetailstView = Backbone.View.extend({

  events: {
    'click .link'       : 'link',
    'click #save-btn'   : 'save',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.userId = options.userId || options.users[0].userId;
    this.user = {};
  },

  render: function (replace) {
    this.$el.show();
    this.loadUserDetailData();
    return this;
  },

  loadUserDetailData: function (replace) {
    $.ajax({
      url: '/api/admin/user/' + this.userId,
      dataType: 'json',
      success: function (userInfo) {
        this.user = userInfo.user;
        this.user.isAdministrator = this.isAdministrator;
        this.user.isApprover = this.isApprover;
        var template = _.template(AdminUserDetailsTemplate)({ user: this.user }); 
        this.$el.html(template);
      }.bind(this),
    });
  },

  isAdministrator: function (user, target) {
    return (target == 'sitewide' && user.isAdmin) ||
      (target == 'agency' && user.isAgencyAdmin) ||
      (target == 'community' && user.is_manager);
  },

  isApprover: function (user, target) {
    return (target == 'sitewide' && user.is_approver) || (target == 'community' && user.is_approver);
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminUserDetailstView;
