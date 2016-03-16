var _ = require('underscore');
var Backbone = require('backbone');
var utils = require('../../../mixins/utilities');
var ModalComponent = require('../../../components/modal');
var AdminUserPasswordView = require('./admin_user_password_view');
var AdminUserTemplate = require('../templates/admin_user_template.html');
var AdminUserTable = require('../templates/admin_user_table.html');
var Paginate = require('../templates/admin_paginate.html');
var LoginConfig = require('../../../config/login.json');


var AdminUserView = Backbone.View.extend({

  events                               : {
    "click a.page"                     : "clickPage",
    "click .link-backbone"             : linkBackbone,
    "click .admin-user-mkadmin"        : "adminCreate",
    "click .admin-user-rmadmin"        : "adminRemove",
    "click .admin-user-mk-agencyadmin" : "agencyAdminCreate",
    "click .admin-user-rm-agencyadmin" : "agencyAdminRemove",
    "click .admin-user-enable"         : "adminEnable",
    "click .admin-user-disable"        : "adminDisable",
    "click .admin-user-unlock"         : "adminUnlock",
    "click .admin-user-resetpw"        : "resetPassword",
    "keyup #user-filter"               : "filter"
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1
    };
  },

  render: function () {
    var self = this;
    Backbone.history.navigate('/admin/user');
    this.$el.show();
    if (this.rendered === true) {
      return this;
    }
    var data = {
      user: window.cache.currentUser,
      login: LoginConfig
    };
    var template = _.template(AdminUserTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    // fetch user data
    this.fetchData(self, this.data);
    return this;
  },

  renderUsers: function (self, data) {
    data.urlbase = '/admin/users';
    data.q = data.q || '';
    // if the limit of results coming back hasn't been set yet
    // use the server's default
    if (!self.limit) {
      self.limit = data.limit;
    }
    data.trueLimit = self.limit;
    data.login = LoginConfig;
    data.user = window.cache.currentUser;
    // render the table
    var template = _.template(AdminUserTable)(data);
    // render the pagination
    var paginate = _.template(Paginate)(data);
    self.$("#user-page").html(paginate);
    self.$("#filter-count").html(data.users.length);
    self.$(".table-responsive").html(template);
    self.$(".btn").tooltip();
    // hide spinner and show results
    self.$(".spinner").hide();
    self.$(".table-responsive").show();
    self.$el.i18n();
  },

  clickPage: function (e) {
    var self = this;
    // if meta or control is held, or if the middle mouse button is pressed,
    // let the link process normally.
    // eg: open a new tab or window based on the browser prefs
    if ((e.metaKey === true) || (e.ctrlKey === true) || (e.which == 2)) {
      return;
    }
    if (e.preventDefault) e.preventDefault();
    // load this page of data
    this.fetchData(self, {
      page: $(e.currentTarget).data('page'),
      q: $($(e.currentTarget).parent('ul')[0]).data('filter'),
      limit: this.limit
    });
  },

  filter: function (e) {
    // get the input box value
    var val = $(e.currentTarget).val().trim();
    // if the filter is the same, don't do anything
    if (val == this.q) {
      return;
    }
    this.q = val;
    // hide the table and show the spinner
    this.$(".table-responsive").hide();
    this.$(".spinner").show();
    // fetch this query, starting from the beginning page
    this.fetchData(this, {
      q: val
    });
  },

  fetchData: function (self, data) {
    // perform the ajax request to fetch the user list
    $.ajax({
      url: '/api/admin/users',
      dataType: 'json',
      data: data,
      success: function (data) {
        self.data = data;
        self.renderUsers(self, data);
        $('.tip').tooltip();
      }
    });
  },

  adminCreate: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      isAdmin: true,
      url: '/api/admin/admin/' + id + '?action=true'
    });
  },

  adminRemove: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      isAdmin: false,
      url: '/api/admin/admin/' + id + '?action=false'
    });
  },

  agencyAdminCreate: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      isAgencyAdmin: true,
      url: '/api/admin/agencyAdmin/' + id + '?action=true'
    });
  },

  agencyAdminRemove: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      isAgencyAdmin: false,
      url: '/api/admin/agencyAdmin/' + id + '?action=false'
    });
  },

  adminEnable: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      disabled: false,
      url: '/api/user/enable/' + id
    });
  },

  adminDisable: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      disabled: true,
      url: '/api/user/disable/' + id
    });
  },

  adminUnlock: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      passwordAttempts: 0,
      url: '/api/admin/unlock/' + id
    });

  },

  updateUser: function (t, data) {
    var self = this;
    var spinner = $($(t.parent()[0]).children('.btn-spin')[0])
    spinner.show();
    t.hide();
    if (data.url) {
      $.ajax({
        url: data.url,
        dataType: 'json',
        success: function (d) {
          // hide the spinner
          spinner.hide();
          // show the opposite button
          if (data.disabled === true) {
            $(t.siblings(".admin-user-enable")[0]).show();
          }
          if (data.disabled === false) {
            $(t.siblings(".admin-user-disable")[0]).show();
          }
          if (data.isAdmin === true) {
            $(t.siblings(".admin-user-rmadmin")[0]).show();
          }
          if (data.isAdmin === false) {
            $(t.siblings(".admin-user-mkadmin")[0]).show();
          }
          if (data.isAgencyAdmin === true) {
            $(t.siblings(".admin-user-rm-agencyadmin")[0]).show();
          }
          if (data.isAgencyAdmin === false) {
            $(t.siblings(".admin-user-mk-agencyadmin")[0]).show();
          }
        }
      });
    }
  },

  resetPassword: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.passwordView) { this.passwordView.cleanup(); }
    if (this.modalComponent) this.modalComponent.cleanup();

    var tr = $($(e.currentTarget).parents('tr')[0]);
    var user = {
      id: tr.data('id'),
      name: $(tr.find('td.admin-table-name')[0]).text().trim()
    };

    // set up the modal
    this.modalComponent = new ModalComponent({
      el: "#reset-password-container",
      id: "reset-password-modal",
      modalTitle: "Reset Password"
    }).render();

    // initialize the view inside the modal
    this.passwordView = new AdminUserPasswordView({
      el: ".modal-template",
      user: user
    }).render();

    // render the modal
    this.$("#reset-password-modal").modal('show');
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminUserView;
