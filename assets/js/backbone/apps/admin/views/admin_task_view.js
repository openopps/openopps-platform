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
    'click input[type="checkbox"]'  : 'filterChanged',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
  },

  render: function () {
    var view = this;
    var url = '/admin/tasks';
    if (this.options.agencyId) url = url + '/' + this.options.agencyId;
    Backbone.history.navigate(url);

    $.ajax({
      url: '/api' + url,
      data: this.data,
      dataType: 'json',
      success: function (data) {
        view.tasks = data;
        var template = _.template(AdminTaskTemplate)(data);
        $('#search-results-loading').hide();
        view.$el.html(template);
        view.$el.show();
        view.renderTasks(view.tasks);
      },
    });
    return this;
  },

  renderTasks: function (tasks) {
    var data = { tasks: [] };
    $('.filter-ckbx:checked').each(function (index, item) {
      data.tasks = data.tasks.concat(tasks[item.id]);
    });
    var template = _.template(AdminTaskTable)(data);
    self.$('#task-table').html(template);
  },

  filterChanged: function () {
    this.renderTasks(this.tasks);
  },

  /*
   * Open a "submitted" task from the admin task view.
   * @param { jQuery Event } event
   */
  openTask: function (event) {
    event.preventDefault();
    if (this.modalComponent) this.modalComponent.cleanup();

    var view = this;
    var id = $(event.currentTarget).data('task-id');
    var title = $( event.currentTarget ).data('task-title');

    $('body').addClass('modal-is-open');

    this.modal = new Modal({
      el: '#site-modal',
      id: 'confirm-publish',
      modalTitle: 'Confirm publish',
      alert: {
        type: 'error',
        text: 'Error publishing task.',
      },
      modalBody: 'Are you sure you want to publish <strong>' + title + '</strong>?',
      primary: {
        text: 'Publish',
        action: function () {
          this.submitPublish.bind(this)(id);
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

  submitPublish: function (id) {
    $.ajax({
      url: '/api/publishTask/' + id,
      data: {'id': id, 'state': 'open'},
      type: 'PUT',
    }).done(function ( model, response, options ) {
      $('.usajobs-modal__canvas-blackout').remove();
      $('.modal-is-open').removeClass();
      this.render();
      this.modal.cleanup();
    }.bind(this)).fail(function (error) {
      $('#confirm-publish').addClass('usajobs-modal--error');
      $('.usajobs-modal__body').html('There was an error attempting to publish this opportunity.');
      $('#usajobs-modal-heading').hide();
      $('#alert-modal__heading').show();
      $('#primary-btn').hide();
    }.bind(this));
  },

  deleteTask: function (e) {
    var view = this,
        id = $(e.currentTarget).data('task-id'),
        title = $(e.currentTarget).data('task-title');
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete "' + title + '"?')) {
      $.ajax({
        url: '/api/task/' + id,
        type: 'DELETE',
      }).done(function () {
        view.render();
      });
    }
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = AdminTaskView;
