// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

// internal dependencies
var Modal = require('../../../components/modal');
var LoginConfig = require('../../../config/login.json');

// templates
var AdminUserTemplate = require('../templates/admin_user_template.html');
var AdminUserTable = require('../templates/admin_user_table.html');
var Paginate = require('../templates/admin_paginate.html');

var AdminUserView = Backbone.View.extend({
  events: {
    'click a.page'              : 'clickPage',
    'click .link-backbone'      : linkBackbone,
    'click .user-enable'        : 'toggleCheckbox',
    'click .assign-admin'       : 'toggleCheckbox',
    'click .user-reset'         : 'resetPassword',
    'keyup #user-filter'        : 'filter',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
    this.agency = {};
    this.community = {};
  },

  render: function () {
    this.$el.show();
    $('[data-target=' + (this.options.target).toLowerCase() + ']').addClass('is-active');

    if (this.options.target !== 'sitewide') {
      this.loadTargetData();
    } else {
      this.loadData();
    }
    return this;
  },

  loadTargetData: function () {
    $.ajax({
      url: '/api/admin/' + this.options.target + '/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this[this.options.target] = targetInfo;
        this.loadData();
      }.bind(this),
    });
  },

  loadData: function () {
    var data = {
      user: window.cache.currentUser,
      login: LoginConfig,
      agency: this.agency,
      community: this.community,
    };

    var template = _.template(AdminUserTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    // fetch user data
    this.fetchData(this.data);
    this.data.target = this.target;
    $('#search-results-loading').hide();
  },

  renderUsers: function (data) {
    data.urlbase = '/admin/users';
    data.q = data.q || '';
    this.limit = this.limit || data.limit;
    data.trueLimit = this.limit;
    data.login = LoginConfig;
    data.user = window.cache.currentUser;

    data.firstOf = data.page * data.limit - data.limit + 1;
    data.lastOf = data.page * data.limit - data.limit + data.users.length;
    data.countOf = data.count;
    data.target = this.target;
    data.isAdministrator = this.isAdministrator;

    // render the table
    var template = _.template(AdminUserTable)(data);
    // render the pagination
    this.renderPagination(data);
    this.$('#filter-count').html(data.users.length);
    this.$('#user-table').html(template);
    this.$('.btn').tooltip();
    this.$('#user-table').show();
    window.scrollTo(0, 0);
    this.$el.localize();
  },

  renderPagination: function (data) {
    data.pages = [];
    data.numberOfPages = Math.ceil(data.count/data.trueLimit);
    if(data.numberOfPages < 8) {
      for (var j = 1; j <= data.numberOfPages; j++)
        data.pages.push(j);
    } else if (data.page < 5) {
      data.pages = [1, 2, 3, 4, 5, 0, data.numberOfPages];
    } else if (data.page >= data.numberOfPages - 3) {
      data.pages = [1, 0];
      for (var i = data.numberOfPages - 4; i <= data.numberOfPages; i++)
        data.pages.push(i);
    } else {
      data.pages = [1, 0, data.page - 1, data.page, data.page + 1, 0, data.numberOfPages];
    }
    
    data.firstOf = data.page * data.trueLimit - data.trueLimit + 1;
    data.lastOf = data.page * data.trueLimit - data.trueLimit + data.users.length;
    data.countOf = data.count;

    var paginate = _.template(Paginate)(data);
    this.$('#user-page').html(paginate);
  },

  clickPage: function (e) {
    if (e.preventDefault) e.preventDefault();
    // load this page of data
    this.fetchData({
      page: $(e.currentTarget).data('page'),
      q: this.q,
      limit: this.limit,
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
    this.$('#user-table').hide();
    this.$('.spinner').show();
    // fetch this query, starting from the beginning page
    this.fetchData({ q: val });
  },

  fetchData: function (data) {
    // perform the ajax request to fetch the user list
    var url = '/api/admin';
    if (this.options.target !== 'sitewide') {
      url += '/' + this.options.target + '/' + this.options.targetId;
    }
    url += '/users';

    $.ajax({
      url: url,
      dataType: 'json',
      data: data,
      success: function (data) {
        this.data = data;
        this.renderUsers(data);
        $('.tip').tooltip();
      }.bind(this),
    });
  },

  getUrlFor: function (id, elem) {
    switch (elem.data('action')) {
      case 'user':
        return '/api/user/' + (elem.prop('checked') ? 'enable' : 'disable') + '/' + id;
      case 'Sitewide':
        return '/api/admin/admin/' + id + '?action=' + elem.prop('checked');
      case 'Agencies':
        return '/api/admin/agencyAdmin/' + id + '?action=' + elem.prop('checked');
      case 'Community':
        return '/api/admin/communityAdmin/' + id + '?action=' + elem.prop('checked');
    }
  },

  toggleCheckbox: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    var username = $(t.parents('tr')[0]).data('user-name');

    if (t.hasClass('assign-admin')) {
      this.confirmAdminAssign(t, {
        id: id,
        name: username,
        agency: this.agency.name,
        checked: t.prop('checked'),
        url: this.getUrlFor(id, t),
      });
    } else {
      this.updateUser(t, {
        id: id,
        checked: t.prop('checked'),
        url: this.getUrlFor(id, t),
      });
    }
  },

  isAdministrator: function (user, target) {
    return (target == 'Sitewide' && user.isAdmin) ||
      (target == 'Agencies' && user.isAgencyAdmin);
  },

  updateUser: function (t, data) {
    var self = this;
    var spinner = $($(t.parent()[0]).children('.icon-spin')[0]);
    // Show spinner and hide checkbox
    spinner.show();
    t.siblings('label').hide();
    if (data.url) {
      $.ajax({
        url: data.url,
        dataType: 'json',
        success: function (d) {
          $('.usajobs-modal__canvas-blackout').remove();
          $('.modal-is-open').removeClass();

          // Hide spinner and show checkbox
          spinner.hide();
          t.siblings('label').show();
          t.prop('checked', data.checked);
        },
      });
    }
  },

  confirmAdminAssign: function (t, data) {
    if (this.modalComponent) this.modalComponent.cleanup();
    $('body').addClass('modal-is-open');

    this.modal = new Modal({
      el: '#site-modal',
      id: 'confirm-assign',
      modalTitle: 'Confirm ' + (data.checked ? 'assign' : 'remove') + ' administrator',
      alert: {
        type: 'error',
        text: 'Error assigning as administrator.',
      },
      modalBody: 'Are you sure you want to ' + (data.checked ? 'assign' : 'remove') + '<strong> ' 
                  + data.name + '</strong> as <strong>' + (data.agency ? data.agency : this.data.target) + '</strong> administrator?',
      primary: {
        text: (data.checked ? 'Assign' : 'Remove'),
        action: function () {
          this.updateUser.bind(this)(t, data);
          this.modal.cleanup();
        }.bind(this),
      },
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modal.cleanup();
        }.bind(this),
      },
    }).render();
  },

  resetPassword: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.passwordView) { this.passwordView.cleanup(); }
    if (this.modalComponent) this.modalComponent.cleanup();

    var tr = $($(e.currentTarget).parents('tr')[0]);
    var user = {
      id: tr.data('id'),
      name: $(tr.find('td.admin-table-name')[0]).text().trim(),
      email: $(tr.find('td.admin-table-username')[0]).text().trim(),
    };

    $('body').addClass('modal-is-open');

    this.modal = new Modal({
      el: '#site-modal',
      id: 'reset-password',
      modalTitle: 'Reset Password',
      alert: {
        type: 'error',
        text: 'Error sending email.',
      },
      modalBody: 'Click <strong>Send email</strong> below to send an email to <strong>' + user.name + '</strong> to reset their password.',
      primary: {
        text: 'Send email',
        action: function () {
          this.submitReset.bind(this)(user.email);
        }.bind(this),
      },
      secondary: {
        text: 'Close',
        action: function () {
          this.modal.cleanup();
        }.bind(this),
      },
    }).render();
  },

  submitReset: function (email) {
    var data = {
      username: email,
    };
    $.ajax({
      url: '/api/auth/forgot',
      type: 'POST',
      data: data,
    }).done(function (success) {
      $('.usajobs-modal__canvas-blackout').remove();
      $('.modal-is-open').removeClass();
      this.modal.cleanup();
    }.bind(this)).fail(function (error) {
      var d = JSON.parse(error.responseText);
      $('#reset-password').addClass('usajobs-modal--error');
      $('.usajobs-modal__body').html('There was an error sending the Reset password email.');
      $('#usajobs-modal-heading').hide();
      $('#alert-modal__heading').show();
      $('#primary-btn').hide();
    }.bind(this));
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminUserView;
