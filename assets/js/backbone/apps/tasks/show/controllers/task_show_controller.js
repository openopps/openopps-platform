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
var TaskEditFormView = require('../../edit/views/task_edit_form_view');
var UIConfig = require('../../../../config/ui.json');
var LoginConfig = require('../../../../config/login.json');

var VolunteerTextTemplate = require('../templates/volunteer_text_template.html').toString();
var VolunteerFullTimeTextTemplate = require('../templates/volunteer_full_time_text_template.html').toString();
var ChangeStateTemplate = require('../templates/change_state_template.html').toString();
var UpdateLocationAgencyTemplate = require('../templates/update_location_agency_template.html').toString();
var UpdateNameTemplate = require('../templates/update_name_template.html').toString();
var CopyTaskTemplate = require('../templates/copy_task_template.html').toString();

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
    'click .project-people__remove'       : 'toggleAssign',
    'mouseenter .project-people-show-div' : popovers.popoverPeopleOn,
    'click .project-people-show-div'      : popovers.popoverClick,
  },

  initialize: function (options) {
    this.options = options;

    this.initializeRenderListener();
    this.initializeTaskItemView();

    this.tagFactory = new TagFactory();
  },

  initializeEdit: function () {
    var model = this.model.toJSON();
    // check if the user owns the task
    var owner = model.isOwner;
    if (owner !== true) {
      // if none of these apply, are they an admin?
      if (window.cache.currentUser) {
        if (window.cache.currentUser.isAdmin === true || model.canEditTask) {
          owner = true;
        }
      }
    }
    // if not the owner, trigger the login dialog.
    if (owner !== true) {
      window.cache.userEvents.trigger('user:request:login', {
        message: "You are not the owner of this opportunity. <a class='link-backbone' href='/tasks/" + _.escape(model.id) + "'>View the opportunity instead.</a>",
        disableClose: true,
      });
      return;
    }

    if (this.taskItemView) this.taskItemView.cleanup();
    if (this.taskEditFormView) this.taskEditFormView.cleanup();
    if(this.options.community && this.options.community.communityType && this.options.community.communityTypeValue) {
      this.madlibTags = this.madlibTags || {};
      this.madlibTags[this.options.community.communityType.toLowerCase()] = [this.options.community.communityTypeValue];
    }
    this.taskEditFormView = new TaskEditFormView({
      el: this.el,
      elVolunteer: '#task-volunteers',
      edit: true,
      taskId: this.model.attributes.id,
      model: this.model,
      community: this.options.community,
      tags: this.tags,
      madlibTags: this.madlibTags,
      tagTypes: this.tagTypes,
    }).render();
    this.$('.task-container').hide();
  },

  initializeRenderListener: function () {
    var self = this;

    this.listenTo(this.model, 'task:show:render:done', function () {
      self.initializeHandlers();
      self.initializeVolunteers();

      if (self.options.action == 'edit') {
        self.initializeEdit();
        popovers.popoverPeopleInit('.project-people-show-div');
      } else {
        popovers.popoverPeopleInit('.project-people-show-div');
        if (self.commentListController) self.commentListController.cleanup();
        self.commentListController = new CommentListController({
          target: 'task',
          id: self.model.attributes.id,
          state: self.model.attributes.state,
          canEditTask: self.model.attributes.canEditTask,
        });
        if (self.attachmentView) self.attachmentView.cleanup();
        self.attachmentView = new AttachmentView({
          target: 'task',
          id: this.model.attributes.id,
          state: this.model.attributes.state,
          owner: this.model.attributes.isOwner,
          volunteer: this.model.attributes.volunteer,
          el: '.attachment-wrapper',
        }).render();
      }
    });
  },

  initializeVolunteers: function () {
    obj = _.find(this.model.attributes.volunteers, function (obj) { return obj.userId == window.cache.currentUser.id; });
    if (obj) {
      $('.volunteer-true').show();
      $('.volunteer-false').hide();
    } else {
      $('.volunteer-true').hide();
      $('.volunteer-false').show();
    }
  },

  initializeHandlers: function () {
    this.listenTo(this.model, 'task:update:state:success', function (data) {
      if (data.attributes.state == 'closed') {
        $('#li-task-close').hide();
        $('#li-task-reopen').show();
        $('#alert-closed').show();
      } else {
        $('#li-task-close').show();
        $('#li-task-reopen').hide();
        $('#alert-closed').hide();
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
      el: this.el,
    });
  },

  v: function (e) {
    return validate(e);
  },

  edit: function (e) {
    if (e.preventDefault) e.preventDefault();

    this.initializeEdit();
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
        replace: true,
      });
      window.cache.userEvents.trigger('user:request:login');
    } else {
      var self = this;
      var child = $(e.currentTarget).children('#like-button-icon');
      var originalEvent = e;
      var requiredTags = window.cache.currentUser.tags.filter(function (t) { return t.type === 'location' || t.type === 'agency'; });
      var agencyRequired = (LoginConfig.agency && LoginConfig.agency.enabled);
      var locationRequired = (LoginConfig.location && LoginConfig.location.enabled);

      // if (this.modalAlert) { this.modalAlert.cleanup(); }
      if (this.modalComponent) { this.modalComponent.cleanup(); }

      // If user's profile has no name, ask them to enter one
      if (!window.cache.currentUser.name) {
        var modalNameTemplate = _.template(UpdateNameTemplate)({});
        this.modalComponent = new ModalComponent({
          el: '#modal-volunteer',
          id: 'update-name',
          modalTitle: "What's your name?",
        }).render();
        return;
      }
      // If user's profile doesn't location, ask them to enter one
      // Includes  quick check to make sure these fields are required
      else if (requiredTags.length !== 2 && (agencyRequired && locationRequired)) {
        var modalInfoTemplate = _.template(UpdateLocationAgencyTemplate)({});
        this.modalComponent = new ModalComponent({
          el: '#modal-volunteer',
          id: 'update-profile',
          modalTitle: 'Please complete your profile',
        }).render();
        self.tagFactory.createTagDropDown({
          type:'location',
          selector:'#rlocation',
          width: '100%',
          multiple: false,
          blurOnChange: true,
        });
        self.tagFactory.createTagDropDown({
          type:'agency',
          selector:'#ragency',
          width: '100%',
          multiple: false,
          blurOnChange: true,
        });
        return;
      }

      var hasFullTimeDetail = _.chain(this.model.attributes.tags)
        .map(_.property('name'))
        .indexOf('Full Time Detail')
        .value() >= 0;

      var modalType = 'volunteerModal';
      var modalContent = _.template(VolunteerTextTemplate)({});
      if (hasFullTimeDetail) {
        modalType = 'volunteerFullTimeModal';
        modalContent = _.template(VolunteerFullTimeTextTemplate)({});
      }

      this.modalComponent = new ModalComponent({
        el: '#modal-volunteer',
        id: 'check-volunteer',
        modalTitle: i18n.t(modalType +'.title'),
      }).render();
    }
  },

  volunteered: function (e) {
    if (e.preventDefault) e.preventDefault();
    // Not able to un-volunteer, so do nothing
  },

  toggleAssign: function (e) {
    if (e.stopPropagation) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var userId = $(t.parent()).data('userid');
  },

  removeVolunteer: function (e) {
    if (e.stopPropagation()) e.stopPropagation();
    if (e.preventDefault) e.preventDefault();
    $(e.currentTarget).off('mouseenter');
    $('.popover').remove();

    var vId = $(e.currentTarget).data('vid');
    var uId = $(e.currentTarget).data('uid');
    var self = this;

    if (typeof cache !== 'undefined')
    {
      $.ajax({
        url: '/api/volunteer/' + vId + '?' + $.param({ taskId: this.model.attributes.id }),
        type: 'DELETE',
      }).done(function (data) {
      });
    }

    var oldVols = this.model.attributes.volunteers || [];
    var unchangedVols = _.filter(oldVols, function (vol){ return ( vol.id !== vId ); } , this)  || [];
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
  },

  stateReopen: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.model.trigger('task:update:state', 'open');
  },

  copy: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;

    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(CopyTaskTemplate)({ title: 'COPY ' + self.model.attributes.title});

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'check-copy',
      modalTitle: 'Copy this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Copy opportunity',
        action: function () {
          $.ajax({
            url: '/api/task/copy',
            method: 'POST',
            data: {
              taskId: self.model.attributes.id,
              title: $('#task-copy-title').val(),
            },
          }).done(function (data) {
            self.modalComponent.cleanup();
            self.options.router.navigate('/tasks/' + data.taskId + '/edit',
              { trigger: true });
          });
        },
      },
    }).render();
  },

  cleanup: function () {
    if (this.taskEditFormView) this.taskEditFormView.cleanup();
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.attachmentView) { this.attachmentView.cleanup(); }
    if (this.commentListController) { this.commentListController.cleanup(); }
    if (this.taskItemView) { this.taskItemView.cleanup(); }
    removeView(this);
  },

});

module.exports = TaskShowController;
