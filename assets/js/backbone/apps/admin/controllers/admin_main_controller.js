var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

var BaseController = require('../../../base/base_controller');
var AdminMainView = require('../views/admin_main_view');
var ModalComponent = require('../../../components/modal');

var ChangeOwnerTemplate = require('../templates/change_owner_template.html').toString();
var AddParticipantTemplate = require('../templates/add_participant_template.html').toString();

var Admin = {};

Admin.ShowController = BaseController.extend({

  events: {
    'click .task-change-owner': 'changeOwner',
    'click .task-add-participant': 'addParticipant',
  },

  // Initialize the admin view
  initialize: function (options) {
    this.options    = options; 

    this.adminMainView = new AdminMainView({
      action: options.action,
      agencyId: options.agencyId,
      el: this.el,
    }).render();
  },

  addParticipant: function (event) {
    if (event.preventDefault) event.preventDefault();
    var taskId = $(event.currentTarget).data('task-id');
    var title = $( event.currentTarget ).data('task-title');
    this.displayAddParticipantModal(event, { taskId: taskId, title: title });
  },

  displayAddParticipantModal: function (event, data) {
    this.target = $(event.currentTarget).parent();
    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(AddParticipantTemplate)(data);
    
    $('body').addClass('modal-is-open');

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'add-participant',
      modalTitle: 'Add an applicant to this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          $('#task-add-participant').select2('destroy');
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Add applicant',
        action: function () {
          $('#task-add-participant').select2('close');
          if(!validate( { currentTarget: $('#task-add-participant') } )) {
            var data = {
              taskId: $('#task-add-participant').data('taskid'),
              userId: $('#task-add-participant').select2('data').id,
            };
            $.ajax({
              url: '/api/admin/assign',
              type: 'POST',
              data: data,
              success: function (data) {
                var newSignUp = '<a href="/profile/' + data.id + '">' + data.name + '</a>';
                var signUps = this.target.siblings('.metrics-table__title').children('.sign-ups');
                if(signUps.html()) {
                  signUps.html(signUps.html().trim() + ', ' + newSignUp);
                } else {
                  this.target.siblings('.metrics-table__title').append('<div class="sign-ups">Sign-ups: ' + newSignUp + '</div>');
                }
                this.target = undefined;
                $('#task-add-participant').select2('destroy');
                this.modalComponent.cleanup();
              }.bind(this),
              error: function (err) {
                // display modal alert type error
              }.bind(this),
            });
          }
        }.bind(this),
      },
      cleanup: function () {
        $('#task-add-participant').select2('destroy');
      },
    }).render();

    setTimeout(function () {
      this.initializeAddParticipantSearch();
    }.bind(this), 100);
  },

  initializeAddParticipantSearch: function () {
    $('#task-add-participant').select2({
      placeholder: 'Search for a user',
      minimumInputLength: 3,
      ajax: {
        url: '/api/ac/user',
        dataType: 'json',
        data: function (term) {
          return { q: term };
        },
        results: function (data) {
          return { results: data };
        },
      },
      dropdownCssClass: 'select2-drop-modal',
      formatResult: function (obj, container, query) {
        return (obj.unmatched ? obj.name : _.escape(obj.name));
      },
      formatSelection: function (obj, container, query) {
        return (obj.unmatched ? obj.name : _.escape(obj.name));
      },
      formatNoMatches: 'No user found by that name',
    });
    $('#task-add-participant').on('change', function (e) {
      validate({ currentTarget: $('#task-add-participant') });
    }.bind(this));
    $('#task-add-participant').focus();
  },

  changeOwner: function (event) {
    if (event.preventDefault) event.preventDefault();
    var taskId = $(event.currentTarget).data('task-id');
    var title = $( event.currentTarget ).data('task-title');
    $.ajax({
      url: '/api/admin/changeOwner/' + taskId,
    }).done(function (data) {
      this.displayChangeOwnerModal(event, { users: data, taskId: taskId, title: title });
    }.bind(this));
  },

  displayChangeOwnerModal: function (event, data) {
    this.target = $(event.currentTarget).parent();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    var modalContent = _.template(ChangeOwnerTemplate)(data);
    $('body').addClass('modal-is-open');

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'change-owner',
      modalTitle: 'Change owner of this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          $('#task-change-owner').select2('destroy');
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Change owner',
        action: function () {
          $('#task-change-owner').select2('close');
          if(!validate( { currentTarget: $('#task-change-owner') } )) { // validate returns true if has validation errors
            $.ajax({
              url: '/api/admin/changeOwner',
              method: 'POST',
              data: {
                taskId: $('#task-change-owner').data('taskid'),
                userId: $('#task-change-owner').select2('data').id,
              },
            }).done(function (data) {
              var newAuthor = '<a href="/profile/' + data.id + '">' + data.name + '</a>';
              this.target.siblings('.metrics-table__author').html(newAuthor);
              this.target = undefined;
              $('#task-change-owner').select2('destroy');
              this.modalComponent.cleanup();
            }.bind(this));
          }
        }.bind(this),
      },
      cleanup: function () {
        $('#task-change-owner').select2('destroy');
      },
    }).render();
    setTimeout(function () {
      this.initializeChangeOwnerOptions();
    }.bind(this), 100);
  },

  initializeChangeOwnerOptions: function () {
    $('#task-change-owner').select2({
      placeholder: 'Select a new owner',
      width: '100%',
      allowClear: true,
      dropdownCssClass: 'select2-drop-modal',
    });
    $('#task-change-owner').on('change', function (e) {
      validate({ currentTarget: $('#task-change-owner') });
    }.bind(this));
    $('#task-change-owner').focus();
  },


  // Cleanup controller and views
  cleanup: function () {
    this.adminMainView.cleanup();
    removeView(this);
  },

});

module.exports = Admin.ShowController;
