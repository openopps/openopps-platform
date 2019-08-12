var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var Modal = require('../../../components/modal');

// templates
var AdminTaskTemplate = require('../templates/admin_task_template.html');
var AdminTaskTable = require('../templates/admin_task_table.html');
var Paginate = require('../templates/admin_paginate.html');

var AdminTaskView = Backbone.View.extend({
  events: {
    'click .delete-task'        : 'deleteTask',
    'click .task-open'          : 'openTask',
    'click input[type="radio"]' : 'filterChanged',
    'click #reindex'            : 'reindex',
    'click a.page'              : 'clickPage',
    'click #task-back'          : linkBackbone,
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.data = {
      page: this.params.get('p') || 1,
      status: this.params.get('q') || 'submitted',
      returnUrl: '/admin',
    };
    if (this.options.target !== 'sitewide') {
      this.data.returnUrl += '/' + this.options.target + '/' + this.options.targetId;
    }
    this.agency = {};
    this.community = {};
    this.baseModal = {
      el: '#site-modal',
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
    };
  },

  render: function () {
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
    var url = '/api/admin';
    if (this.options.target !== 'sitewide') {
      url += '/' + this.options.target + '/' + this.options.targetId;
    }
    url += '/tasks';
    $.ajax({
      url: url,
      data: this.data,
      dataType: 'json',
      success: function (data) {
        _.extend(data, this.data);
        data.agency = this.agency;
        data.community = this.community;
        var template = _.template(AdminTaskTemplate)(data);
        $('#search-results-loading').hide();
        this.$el.html(template);
        this.$el.show();
        this.renderTasks(data.tasks, data.totals);
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
      },
    });
    return this;
  },

  renderTasks: function (tasks, totals) {
    var totalResults = (_.findWhere(totals, { task_state: this.data.status }) || {}).count || 0;
    var data = {
      tasks: tasks,
      status: this.data.status,
      targetAudience: this.community.targetAudience,
      countOf: totalResults,
      firstOf: this.data.page * 25 - 24,
      lastOf: this.data.page * 25 - 25 + tasks.length,
    };
    var template = _.template(AdminTaskTable)(data);
    this.$('#task-table').html(template);
    if (totalResults) {
      var pageData = getPaginationData(totalResults, 25, this.data.page);
      _.extend(pageData, { urlbase: window.location.pathname, q: this.data.status });
      this.$('#task-page').html(_.template(Paginate)(pageData));
    }
  },

  clickPage: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.data.page = $(e.currentTarget).data('page');
    Backbone.history.navigate(this.generateURL(), { trigger: false });
    this.loadData();
    window.scrollTo(0, 0);
  },

  generateURL: function () {
    var url = window.location.pathname;
    url += '?q=' + this.data.status + '&p=' + this.data.page;
    return url;
  },

  filterChanged: function () {
    var status = $('input[name=opp-status]:checked').val();
    this.data.status = status;
    this.data.page = 1;
    Backbone.history.navigate(this.generateURL(), { trigger: false });
    this.loadData();
  },

  collectEventData: function (event) {
    event.preventDefault();
    return { 
      id: $(event.currentTarget).data('task-id'),
      title: $( event.currentTarget ).data('task-title'),
    };
  },

  /*
   * Open a "submitted" task from the admin task view.
   * @param { jQuery Event } event
   */
  openTask: function (event) {
    var data = this.collectEventData(event);
    var titleAction = (this.community.targetAudience !== 'Students') ? 'publish' : 'approval';
    var bodyAction = (this.community.targetAudience !== 'Students') ? 'publish' : 'approve';
    var displayModal = new Modal({
      id: 'confirm-publish',
      modalTitle: 'Confirm ' + titleAction,
      modalBody: 'Are you sure you want to ' + bodyAction + ' <strong>' + data.title + '</strong>?',
      primary: {
        text: bodyAction.charAt(0).toUpperCase() + bodyAction.slice(1),
        action: function () {
          this.submitPublish.bind(this)(data.id, displayModal);
        }.bind(this),
      },
    });
    displayModal.render();
  },

  submitPublish: function (id, displayModal) {
    $.ajax({
      url: '/api/publishTask/' + id,
      data: {'id': id, 'state': 'open'},
      type: 'PUT',
    }).done(function ( model, response, options ) {
      displayModal.cleanup();
      this.render();
    }.bind(this)).fail(function (error) {
      displayModal.displayError('An unexpected error occured attempting to publish this opportunity.');
    }.bind(this));
  },

  deleteTask: function (event) {
    var data = this.collectEventData(event);
    var deleteModal = new Modal({
      id: 'confirm-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Confirm deletion',
      modalBody: 'Are you sure you want to delete <strong>' + data.title + '</strong>? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Delete',
        action: function () {
          this.submitDelete.bind(this)(data.id, deleteModal);
        }.bind(this),
      },
    });
    deleteModal.render();
  },

  submitDelete: function (id, deleteModal) {
    $.ajax({
      url: '/api/task/' + id,
      type: 'DELETE',
    }).done(function ( model, response, options ) {
      deleteModal.cleanup();
      this.render();
    }.bind(this)).fail(function (error) {
      deleteModal.displayError('There was an error attempting to delete this opportunity.', 'Error Deleting');
    }.bind(this));
  },

  cleanup: function () {
    removeView(this);
  },

  reindex: function () {
    var reindexModal = new Modal({
      id: 'confirm-reindex',
      modalTitle: 'Confirm reindex',
      modalBody: 'Are you sure you want to reindex</strong>? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'OK',
        action: function () {
          if (reindexModal.options.primary.text === 'OK')
          {
            reindexModal.options.disableClose = true;
            reindexModal.options.disablePrimary = true;
            reindexModal.options.secondary = null;
            reindexModal.options.modalBody = 'Reindexing...';
            reindexModal.options.primary.text = 'Close';
            reindexModal.refresh();
            $.ajax({
              url: '/api/task/reindex/',
              data: {},
              type: 'GET',
            }).done(function (model) {
              reindexModal.options.modalBody = 'Finished reindexing ' + model + ' opportunities';
              reindexModal.options.disablePrimary = false;
              reindexModal.refresh();
            }.bind(this)).fail(function (error) {
              reindexModal.displayError('There was an error attempting to reindex.', 'Error Reindexing');             
            }.bind(this));
          } else {
            reindexModal.cleanup();
          }
        }.bind(this),
      },
    });
    reindexModal.render();  
  },
});

module.exports = AdminTaskView;
