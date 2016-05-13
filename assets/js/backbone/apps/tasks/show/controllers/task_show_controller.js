var Bootstrap = require('bootstrap');
var _ = require('underscore');
var Backbone = require('backbone');
var Popovers = require('../../../../mixins/popovers');

var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');

var BaseView = require('../../../../base/base_view');
var CommentListController = require('../../../comments/list/controllers/comment_list_controller');
var AttachmentView = require('../../../attachment/views/attachment_show_view');
var TaskItemView = require('../views/task_item_view');
var TagFactory = require('../../../../components/tag_factory');
var ModalComponent = require('../../../../components/modal');
var ModalAlert = require('../../../../components/modal_alert');
var TaskEditFormView = require('../../edit/views/task_edit_form_view');
var UIConfig = require('../../../../config/ui.json');
var LoginConfig = require('../../../../config/login.json');

var fs = require('fs');
var VolunteerTextTemplate = fs.readFileSync(__dirname + '/../templates/volunteer_text_template.html').toString();
var ChangeStateTemplate = fs.readFileSync(__dirname + '/../templates/change_state_template.html').toString();
var UpdateLocationAgencyTemplate = fs.readFileSync(__dirname + '/../templates/update_location_agency_template.html').toString();
var UpdateNameTemplate = fs.readFileSync(__dirname + '/../templates/update_name_template.html').toString();
var CopyTaskTemplate = fs.readFileSync(__dirname + '/../templates/copy_task_template.html').toString();




var popovers = new Popovers();

var TaskShowController = BaseView.extend({

  el: '#container',

  events: {
    'change .validate'                    : 'v',
    'keyup .validate'                     : 'v',
    'click #task-edit'                    : 'edit',
    'click #task-view'                    : 'view',
    'click #volunteer'                    : 'volunteer',
    'click #volunteered'                  : 'volunteered',
    'click #task-close'                   : 'stateChange',
    'click #task-reopen'                  : 'stateReopen',
    'click #task-copy'                    : 'copy',
    'click .link-backbone'                : linkBackbone,
    'click .volunteer-delete'             : 'removeVolunteer',
    'mouseenter .project-people-show-div' : popovers.popoverPeopleOn,
    'click .project-people-show-div'      : popovers.popoverClick,
  },

  initialize: function (options) {
    this.options = options;

    this.initializeTaskItemView();
    this.initializeChildren();

    this.tagFactory = new TagFactory();
  },

  initializeEdit: function () {
    var model = this.model.toJSON();
    // check if the user owns the task
    var owner = model.isOwner;
    if (owner !== true) {
      // if none of these apply, are they an admin?
      if (window.cache.currentUser) {
        if (window.cache.currentUser.isAdmin === true) {
          owner = true;
        }
      }
    }
    // if not the owner, trigger the login dialog.
    if (owner !== true) {
      window.cache.userEvents.trigger("user:request:login", {
        message: "You are not the owner of this opportunity. <a class='link-backbone' href='/tasks/" + _.escape(model.id) + "'>View the opportunity instead.</a>",
        disableClose: true
      });
      return;
    }

    if (this.taskEditFormView) this.taskEditFormView.cleanup();
    this.taskEditFormView = new TaskEditFormView({
      el: '.edit-task-container',
      elVolunteer: '#task-volunteers',
      edit: true,
      taskId: this.model.attributes.id,
      model: this.model,
      tags: this.tags,
      madlibTags: this.madlibTags,
      tagTypes: this.tagTypes
    }).render();
    this.$(".task-show-madlib").hide();
    this.$(".li-task-view").show();
    this.$(".li-task-edit").hide();
    this.$(".task-container").hide();
    this.$(".li-task-copy").hide();
  },

  initializeChildren: function () {
    var self = this;

    this.listenTo(this.model, 'task:show:render:done', function () {
      self.initializeHandlers();

      if (window.cache.currentUser) {
        self.initializeVolunteers();
      }

      if (self.options.action == 'edit') {
        self.initializeEdit();
        popovers.popoverPeopleInit(".project-people-show-div");
      } else {
        popovers.popoverPeopleInit(".project-people-show-div");
        if (self.commentListController) self.commentListController.cleanup();
        self.commentListController = new CommentListController({
          target: 'task',
          id: self.model.attributes.id
        });
        if (self.attachmentView) self.attachmentView.cleanup();
        self.attachmentView = new AttachmentView({
          target: 'task',
          id: this.model.attributes.id,
          state: this.model.attributes.state,
          owner: this.model.attributes.isOwner,
          volunteer: this.model.attributes.volunteer,
          el: '.attachment-wrapper'
        }).render();
      }

    });
  },

  initializeVolunteers: function () {
    if (this.model.attributes.volunteer) {
      $('.volunteer-true').show();
      $('.volunteer-false').hide();
    } else {
      $('.volunteer-true').hide();
      $('.volunteer-false').show();
    }
  },

  initializeHandlers: function() {
    this.listenTo(this.model, "task:update:state:success", function (data) {
      if (data.attributes.state == 'closed') {
        $("#li-task-close").hide();
        $("#li-task-reopen").show();
        $("#alert-closed").show();
      } else {
        $("#li-task-close").show();
        $("#li-task-reopen").hide();
        $("#alert-closed").hide();
      }
    });
  },

  initializeTaskItemView: function () {
    var self = this;
    // Get the tag type info from the view so we don't have to refetch
    this.listenTo(this.model, 'task:tag:types', function (data) {
      self.tagTypes = data;
    });
    this.listenTo(this.model, 'task:tag:data', function (tags, madlibTags) {
      self.tags = tags;
      self.madlibTags = madlibTags;
    });
    if (this.taskItemView) this.taskItemView.cleanup();
    this.taskItemView = new TaskItemView({
      model: this.options.model,
      router: this.options.router,
      id: this.options.id,
      el: this.el
    });
  },

  v: function (e) {
    return validate(e);
  },

  edit: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.initializeEdit();
    popovers.popoverPeopleInit(".project-people-div");
    Backbone.history.navigate('tasks/' + this.model.id + '/edit');
  },

  view: function (e) {
    if (e.preventDefault) e.preventDefault();
    Backbone.history.navigate('tasks/' + this.model.id, { trigger: true });
  },

  volunteer: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate(window.location.pathname + '?volunteer', {
        trigger: false,
        replace: true
      });
      window.cache.userEvents.trigger("user:request:login");
    } else {
      var self = this;
      var child = $(e.currentTarget).children("#like-button-icon");
      var originalEvent = e;
      var requiredTags = window.cache.currentUser.tags.filter(function(t) { return t.type === 'location' || t.type === 'agency'; });
      var agencyRequired = (LoginConfig.agency && LoginConfig.agency.enabled);
      var locationRequired = (LoginConfig.location && LoginConfig.location.enabled);

      if (this.modalAlert) { this.modalAlert.cleanup(); }
      if (this.modalComponent) { this.modalComponent.cleanup(); }

      // If user's profile has no name, ask them to enter one
      if (!window.cache.currentUser.name) {
        var modalNameTemplate = _.template(UpdateNameTemplate)({});
        this.modalComponent = new ModalComponent({
          el: "#modal-volunteer",
          id: "update-name",
          modalTitle: "What's your name?"
        }).render();
        this.modalAlert = new ModalAlert({
          el: "#update-name .modal-template",
          modalDiv: '#update-name',
          content: modalNameTemplate,
          validateBeforeSubmit: true,
          cancel: i18n.t('volunteerModal.cancel'),
          submit: i18n.t('volunteerModal.ok'),
          callback: function(e) {
            var name = $('#update-name-field').val();
            $.ajax({
              url: '/api/user/' + window.cache.currentUser.id,
              method: 'PUT',
              data: {
                username: window.cache.currentUser.username,
                name: name
              }
            }).done(function(user) {
              window.cache.currentUser.name = user.name;
              self.volunteer(originalEvent);
            });
          }
        }).render();
        return;
      }
      // If user's profile doesn't location, ask them to enter one
      // Includes  quick check to make sure these fields are required
      else if (requiredTags.length !== 2 && (agencyRequired && locationRequired)) {
        var modalInfoTemplate = _.template(UpdateLocationAgencyTemplate)({});
        this.modalComponent = new ModalComponent({
          el: "#modal-volunteer",
          id: "update-profile",
          modalTitle: "Please complete your profile"
        }).render();
        this.modalAlert = new ModalAlert({
          el: "#update-profile .modal-template",
          modalDiv: '#update-profile',
          content: modalInfoTemplate,
          validateBeforeSubmit: true,
          cancel: i18n.t('volunteerModal.cancel'),
          submit: i18n.t('volunteerModal.ok'),
          callback: function(e) {
            var agency = $('#ragency').select2('data');
            var location = $('#rlocation').select2('data');
            var data = {};
            data.username = window.cache.currentUser.username;
            data.tags = [agency, location].map(function(t) {
              return { id: t.id };
            });
            $.ajax({
              url: '/api/user/' + window.cache.currentUser.id,
              method: 'PUT',
              data: data
            }).done(function(user) {
              window.cache.currentUser.tags = user.tags;
              self.volunteer(originalEvent);
            });
          }
        }).render();
        self.tagFactory.createTagDropDown({
          type:"location",
          selector:"#rlocation",
          width: "100%",
          multiple: false
        });
        self.tagFactory.createTagDropDown({
          type:"agency",
          selector:"#ragency",
          width: "100%",
          multiple: false
        });
        return;
      }

      this.modalComponent = new ModalComponent({
        el: "#modal-volunteer",
        id: "check-volunteer",
        modalTitle: i18n.t("volunteerModal.title")
      }).render();

      var modalContent = _.template(VolunteerTextTemplate)({});

      this.modalAlert = new ModalAlert({
        el: "#check-volunteer .modal-template",
        modalDiv: '#check-volunteer',
        content: modalContent,
        cancel: i18n.t('volunteerModal.cancel'),
        submit: i18n.t('volunteerModal.ok'),
        validateBeforeSubmit: false,
        callback: function (e) {
          // user clicked the submit button
          $.ajax({
            url: '/api/volunteer/',
            type: 'POST',
            data: {
              taskId: self.model.attributes.id
            }
          }).done( function (data) {
            $('.volunteer-true').show();
            $('.volunteer-false').hide();
            var html = '<div class="project-people-div" data-userid="' + data.userId + '" data-voluserid="' + data.userId + '"><img src="/api/user/photo/' + data.userId + '" class="project-people"/>';
            if (self.options.action === "edit") {
              html += '<a href="#" class="delete-volunteer fa fa-times"  id="delete-volunteer-' + data.id + '" data-uid="' + data.userId + '" data-vid="' +  data.id + '"></a>';
            }
            html += '</div>';
            $('#task-volunteers').append(html);
            popovers.popoverPeopleInit(".project-people-div");
          });
        }
      }).render();
    }
  },

  volunteered: function (e) {
    if (e.preventDefault) e.preventDefault();
    // Not able to un-volunteer, so do nothing
  },

  removeVolunteer: function(e) {
    if (e.stopPropagation()) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    $(e.currentTarget).off("mouseenter");
    $('.popover').remove();

    var vId = $(e.currentTarget).data('vid');
    var uId = $(e.currentTarget).data('uid');
    var self = this;

    if (typeof cache !== "undefined")
    {
      $.ajax({
        url: '/api/volunteer/' + vId,
        type: 'DELETE',
        data: {
          taskId: this.model.attributes,
          vId: vId
        },
      }).done(function (data) {
          // done();
      });
    }

    var oldVols = this.model.attributes.volunteers || [];
    var unchangedVols = _.filter(oldVols, function(vol){ return ( vol.id !== vId ); } , this)  || [];
    this.model.attributes.volunteers = unchangedVols;
    $('[data-voluserid="' + uId + '"]').remove();
    if (window.cache.currentUser.id === uId) {
      $('.volunteer-false').show();
      $('.volunteer-true').hide();
    }
  },

  stateChange: function ( e ) {

    if ( e && _.isFunction( e.preventDefault ) ) { e.preventDefault(); }

    var self = this;

    if ( this.modalAlert ) { this.modalAlert.cleanup(); }
    if ( this.modalComponent ) { this.modalComponent.cleanup(); }

    var states = UIConfig.states;

    if ( draftAdminOnly && ! window.cache.currentUser.isAdmin ) {

      states = _( states ).reject( function ( state ) {
        return state.value === 'draft';
      } );

    }

    var modalData = {

      model: self.model,
      states: states,

    };

    var submitValue = 'Change '+i18n.t( 'Task' )+' State';

    if ( self.model.isDraft() ) {
      submitValue = false;
    }

    var modalContent = _.template( ChangeStateTemplate )( modalData );

    this.modalComponent = new ModalComponent( {

      el: '#modal-close',
      id: 'check-close',
      modalTitle: 'Change '+i18n.t( 'Task' ) + ' State',

    } ).render();

    this.modalAlert = new ModalAlert( {

      el: '#check-close .modal-template',
      modalDiv: '#check-close',
      content: modalContent,
      cancel: 'Cancel',
      submit: submitValue,
      callback: function ( e ) {
        // user clicked the submit button
        self.model.trigger( 'task:update:state', $( 'input[name=opportunityState]:checked' ).val() );
        self.taskItemView.render( self.taskItemView );
      },

    } ).render();

  },

  stateReopen: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.model.trigger("task:update:state", 'open');
  },

  copy: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;

    if (this.modalAlert) { this.modalAlert.cleanup(); }
    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(CopyTaskTemplate)();

    this.modalComponent = new ModalComponent({
      el: "#modal-copy",
      id: "check-copy",
      modalTitle: "Copy This Opportunity"
    }).render();

    this.modalAlert = new ModalAlert({
      el: "#check-copy .modal-template",
      modalDiv: '#check-copy',
      content: modalContent,
      validateBeforeSubmit: true,
      cancel: 'Cancel',
      submit: 'Copy Opportunity',
      callback: function (e) {
        $.ajax({
          url: '/api/task/copy',
          method: 'POST',
          data: {
            taskId: self.model.attributes.id,
            title: $('#task-copy-title').val()
          }
        }).done(function(data) {
          self.options.router.navigate('/tasks/' + data.taskId + '/edit',
                                       { trigger: true });
        });
      }
    }).render();

    $('#task-copy-title').val('COPY ' + self.model.attributes.title);
  },

  cleanup: function () {
    if (this.taskEditFormView) this.taskEditFormView.cleanup();
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.attachmentView) { this.attachmentView.cleanup(); }
    if (this.commentListController) { this.commentListController.cleanup(); }
    if (this.taskItemView) { this.taskItemView.cleanup(); }
    removeView(this);
  }

});

module.exports = TaskShowController;
