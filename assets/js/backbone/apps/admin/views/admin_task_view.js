var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var Modal = require('../../../components/modal');

// templates
var AdminTaskTemplate = require('../templates/admin_task_template.html');
var AdminTaskTable = require('../templates/admin_task_table.html');

var AdminTaskView = Backbone.View.extend({
  events: {
    'click .delete-task'            : 'deleteTask',
    'click .task-open'              : 'openTask',
    'click input[type="radio"]'     : 'filterChanged',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
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
        this.tasks = data;
        data.agency = this.agency;
        data.community= this.community;
        var template = _.template(AdminTaskTemplate)(data);
        $('#search-results-loading').hide();
        this.$el.html(template);
        this.$el.show();
        this.renderTasks(this.tasks);
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
      },
    });
    return this;
  },

  renderTasks: function (tasks) {
    var data = { tasks: [] };
    $('.filter-radio:checked').each(function (index, item) {
      data.tasks = data.tasks.concat(tasks[item.id]);
    });
    var template = _.template(AdminTaskTable)(data);
    this.$('#task-table').html(template);
  },

  filterChanged: function () {
    this.renderTasks(this.tasks);
    var t = $('input[name=opp-status]:checked').val(); 
    if (t == 'submitted') {
      $('[data-target=change-add]').addClass('hide');
      $('[data-target=publish-delete]').removeClass('hide');
    } else if (t == 'open' || t == 'notOpen' || t == 'inProgress') {
      $('[data-target=change-add]').removeClass('hide');
      $('[data-target=publish-delete]').addClass('hide');
    } else if (t == 'completed' || t == 'canceled') {
      $('[data-target=change-add]').addClass('hide');
      $('[data-target=publish-delete]').addClass('hide');
    }
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
    this.displayModal(new Modal(_.extend(this.baseModal, {
      id: 'confirm-publish',
      modalTitle: 'Confirm publish',
      alert: {
        type: 'error',
        text: 'Error publishing task.',
      },
      modalBody: 'Are you sure you want to publish <strong>' + data.title + '</strong>?',
      primary: {
        text: 'Publish',
        action: function () {
          this.submitPublish.bind(this)(data.id);
        }.bind(this),
      },
    })));
  },

  submitPublish: function (id) {
    $.ajax({
      url: '/api/publishTask/' + id,
      data: {'id': id, 'state': 'open'},
      type: 'PUT',
    }).done(function ( model, response, options ) {
      this.cleanupModal();
    }.bind(this)).fail(function (error) {
      this.displayError('confirm-publish', 'There was an error attempting to publish this opportunity.');
    }.bind(this));
  },

  deleteTask: function (event) {
    var data = this.collectEventData(event);
    this.displayModal(new Modal(_.extend(this.baseModal, {
      id: 'confirm-deletion',
      modalTitle: 'Confirm deletion',
      alert: {
        type: 'error',
        text: 'Error deleting task.',
      },
      modalBody: 'Are you sure you want to delete <strong>' + data.title + '</strong>? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Delete',
        action: function () {
          this.submitDelete.bind(this)(data.id);
        }.bind(this),
      },
    })));
  },

  submitDelete: function (id) {
    $.ajax({
      url: '/api/task/' + id,
      type: 'DELETE',
    }).done(function ( model, response, options ) {
      this.cleanupModal();
    }.bind(this)).fail(function (error) {
      this.displayError('confirm-deletion', 'There was an error attempting to delete this opportunity.');
    }.bind(this));
  },

  displayModal: function (modal) {
    if (this.modalComponent) this.modalComponent.cleanup();
    this.modalComponent = modal.render();
    $('body').addClass('modal-is-open');
  },

  cleanupModal: function () {
    $('.usajobs-modal__canvas-blackout').remove();
    $('.modal-is-open').removeClass();
    this.render();
    this.modalComponent.cleanup();
  },

  displayError: function (modalId, error) {
    $('#' + modalId).addClass('usajobs-modal--error');
    $('.usajobs-modal__body').html(error);
    $('#usajobs-modal-heading').hide();
    $('#alert-modal__heading').show();
    $('#primary-btn').hide();
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = AdminTaskView;
