var Bootstrap = require('bootstrap');
var _ = require('underscore');
var Backbone = require('backbone');
var Popovers = require('../../../../mixins/popovers');
var utils = require('../../../../mixins/utilities');
var BaseView = require('../../../../base/base_view');
var CommentListController = require('../../../comments/list/controllers/comment_list_controller');
var AttachmentView = require('../../../attachment/views/attachment_show_view');
var TaskItemView = require('../views/task_item_view');
var TagShowView = require('../../../tag/show/views/tag_show_view');
var ModalComponent = require('../../../../components/modal');
var ModalAlert = require('../../../../components/modal_alert');
var TaskEditFormView = require('../../edit/views/task_edit_form_view');
var UIConfig = require('../../../../config/ui.json');
var VolunteerSupervisorNotifyTemplate = require('../templates/volunteer_supervisor_notify_template.html');
var VolunteerTextTemplate = require('../templates/volunteer_text_template.html');
var ChangeStateTemplate = require('../templates/change_state_template.html');
var UpdateNameTemplate = require('../templates/update_name_template.html');


var popovers = new Popovers();

var TaskShowController = BaseView.extend({

  el: "#container",

  events: {
    'change .validate'                : 'v',
    'keyup .validate'                 : 'v',
    'click #task-edit'                : 'edit',
    'click #task-view'                : 'view',
    "click #like-button"              : 'like',
    'click #volunteer'                : 'volunteer',
    'click #volunteered'              : 'volunteered',
    "click #task-close"               : "stateChange",
    "click #task-reopen"              : "stateReopen",
    "click .link-backbone"            : linkBackbone,
    "click .delete-volunteer"         : 'removeVolunteer',
    "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
    "click .project-people-div"       : popovers.popoverClick
  },

  initialize: function (options) {
    this.options = options;

    this.initializeTaskItemView();
    this.initializeChildren();

    //load user settings so they are available as needed
    this.getUserSettings(window.cache.currentUser);

  },

  initializeEdit: function () {
    var model = this.model.toJSON();
    // check if the user owns the task
    var owner = model.isOwner;
    if (owner !== true) {
      // if they don't own the task, do they own the project?
      if (!_.isUndefined(model.project)) {
        if (model.project.isOwner === true) {
          owner = true;
        }
      }
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
      el: '.edit-task-section',
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
    this.$(".task-view").hide();
  },

  initializeChildren: function () {
    var self = this;

    this.listenTo(this.model, 'task:show:render:done', function () {
      self.initializeHandlers();
      self.initializeLikes();

      if (window.cache.currentUser) {
        self.initializeVolunteers();
      }

      if (self.options.action == 'edit') {
        self.initializeEdit();
        popovers.popoverPeopleInit(".project-people-div");
      } else {
        popovers.popoverPeopleInit(".project-people-div");
        if (self.commentListController) self.commentListController.cleanup();
        self.commentListController = new CommentListController({
          target: 'task',
          id: self.model.attributes.id
        });
        if (self.attachmentView) self.attachmentView.cleanup();
        self.attachmentView = new AttachmentView({
          target: 'task',
          id: this.model.attributes.id,
          owner: this.model.attributes.isOwner,
          el: '.attachment-wrapper'
        }).render();
      }

      if (self.tagView) self.tagView.cleanup();
      self.tagView = new TagShowView({
        model: self.model,
        el: '.tag-wrapper',
        target: 'task',
        targetId: 'taskId',
        edit: false
      }).render();

    });
  },

  initializeLikes: function () {
    $("#like-number").text(this.model.attributes.likeCount);
    if (parseInt(this.model.attributes.likeCount) === 1) {
      $("#like-text").text($("#like-text").data('singular'));
    } else {
      $("#like-text").text($("#like-text").data('plural'));
    }
    if (this.model.attributes.like) {
      $("#like-button-icon").removeClass('fa fa-star-o');
      $("#like-button-icon").addClass('fa fa-star');
    }
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

  like: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;
    var child = $(e.currentTarget).children("#like-button-icon");
    var likenumber = $("#like-number");
    // Not yet liked, initiate like
    if (child.hasClass('fa-star-o')) {
      child.removeClass('fa-star-o');
      child.addClass('fa-star');
      likenumber.text(parseInt(likenumber.text()) + 1);
      if (parseInt(likenumber.text()) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      $.ajax({
        url: '/api/like/liket/' + this.model.attributes.id
      }).done( function (data) {
        // liked!
        // response should be the like object
        // console.log(data.id);
      });
    }
    // Liked, initiate unlike
    else {
      child.removeClass('fa-star');
      child.addClass('fa-star-o');
      likenumber.text(parseInt(likenumber.text()) - 1);
      if (parseInt(likenumber.text()) === 1) {
        $("#like-text").text($("#like-text").data('singular'));
      } else {
        $("#like-text").text($("#like-text").data('plural'));
      }
      $.ajax({
        url: '/api/like/unliket/' + this.model.attributes.id
      }).done( function (data) {
        // un-liked!
        // response should be null (empty)
      });
    }
  },
  getUserSettings: function (userId) {
    //does this belong somewhere else?
    if ( _.isNull(userId) ){ return null; }
    $.ajax({
      url: '/api/usersetting/'+userId.id,
      type: 'GET',
      dataType: 'json'
    })
    .success(function(data){
      _.each(data,function(setting){
        //save active settings to the current user object
        if ( setting.isActive ){
          window.cache.currentUser[setting.key]=setting;
        }
      });
    });
  },

  deleteUserSettingByKey: function(settingKey) {
    //this function expects the entire row from usersetting in the form
    //     window.cache.currentUser[settingKey] = {}
    var self = this;

    //if not set skip
    var targetId =  ( window.cache.currentUser[settingKey] ) ? window.cache.currentUser[settingKey].id : null ;

    if ( targetId ){
      $.ajax({
        url: '/api/usersetting/'+targetId,
        type: 'DELETE',
        dataType: 'json'
      })
    }

  },

  saveUserSettingByKey: function(userId, options) {
    //this function expects the entire row from usersetting in the form
    //     window.cache.currentUser[settingKey] = {}
    var self = this;

    //are values the same, stop
    if ( options.newValue == options.oldValue ) { return true; }

    //if delete old is set, delete exisitng value
    //   default is delete
    if ( !options.deleteOld ){
      self.deleteUserSettingByKey(options.settingKey);
    }

    $.ajax({
        url: '/api/usersetting/',
        type: 'POST',
        dataType: 'json',
        data: {
          userId: userId,
          key: options.settingKey,
          value: options.newValue
        }
      });
  },

  volunteer: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (!window.cache.currentUser) {
      window.cache.taskVolunteer = this.model.id;
      window.cache.userEvents.trigger("user:request:login");
    } else {
      var self = this;
      var child = $(e.currentTarget).children("#like-button-icon");
      var originalEvent = e;

      if (this.modalAlert) { this.modalAlert.cleanup(); }
      if (this.modalComponent) { this.modalComponent.cleanup(); }

      // If user's profile has no name, ask them to enter one
      if (!window.cache.currentUser.name) {
        var modalContent = _.template(UpdateNameTemplate)({});
        this.modalComponent = new ModalComponent({
          el: "#modal-volunteer",
          id: "update-name",
          modalTitle: "What's your name?"
        }).render();
        this.modalAlert = new ModalAlert({
          el: "#update-name .modal-template",
          modalDiv: '#update-name',
          content: modalContent,
          validateBeforeSubmit: true,
          cancel: i18n.t('volunteerModal.cancel'),
          submit: i18n.t('volunteerModal.ok'),
          callback: function(e) {
            var name = $('#update-name-field').val();
            $.ajax({
              url: '/api/user/' + window.cache.currentUser.id,
              method: 'PUT',
              data: { name: name }
            }).done(function(user) {
              window.cache.currentUser.name = user.name;
              self.volunteer(originalEvent);
            });
          }
        }).render();
        return;
      }

      this.modalComponent = new ModalComponent({
        el: "#modal-volunteer",
        id: "check-volunteer",
        modalTitle: i18n.t("volunteerModal.title")
      }).render();

      if ( UIConfig.supervisorEmail.useSupervisorEmail ) {
        //not assigning as null because null injected into the modalContent var shows as a literal value
        //    when what we want is nothing if value is null
        var supervisorEmail = ( window.cache.currentUser.supervisorEmail ) ? window.cache.currentUser.supervisorEmail.value  : "";
        var supervisorName = ( window.cache.currentUser.supervisorName ) ? window.cache.currentUser.supervisorName.value : "";
        var validateBeforeSubmit = true;
        var modalContent = _.template(VolunteerSupervisorNotifyTemplate)({supervisorEmail: supervisorEmail,supervisorName: supervisorName});
      } else {
        validateBeforeSubmit = false;
        var modalContent = _.template(VolunteerTextTemplate)({});
      }

      this.modalAlert = new ModalAlert({
        el: "#check-volunteer .modal-template",
        modalDiv: '#check-volunteer',
        content: modalContent,
        cancel: i18n.t('volunteerModal.cancel'),
        submit: i18n.t('volunteerModal.ok'),
        validateBeforeSubmit: validateBeforeSubmit,
        callback: function (e) {
          if ( UIConfig.supervisorEmail.useSupervisorEmail ) {
            self.saveUserSettingByKey(window.cache.currentUser.id,{settingKey:"supervisorEmail",newValue: $('#userSuperVisorEmail').val(),oldValue: supervisorEmail});
            self.saveUserSettingByKey(window.cache.currentUser.id,{settingKey:"supervisorName",newValue: $('#userSuperVisorName').val(),oldValue: supervisorName});
          }
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
              html += '<a href="#" class="delete-volunteer volunteer-delete fa fa-times"  id="delete-volunteer-' + data.id + '" data-uid="' + data.userId + '" data-vid="' +  data.id + '"></a>';
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

  stateChange: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;

    if (this.modalAlert) { this.modalAlert.cleanup(); }
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    var states = UIConfig.states;
    if (draftAdminOnly && !window.cache.currentUser.isAdmin) {
      states = _(states).reject(function(state) {
        return state.value === 'draft';
      });
    }

    var modalContent = _.template(ChangeStateTemplate)({model:self.model,states: states});
    this.modalComponent = new ModalComponent({
      el: "#modal-close",
      id: "check-close",
      modalTitle: "Change "+i18n.t("Task")+" State"
    }).render();

    this.modalAlert = new ModalAlert({
      el: "#check-close .modal-template",
      modalDiv: '#check-close',
      content: modalContent,
      cancel: 'Cancel',
      submit: 'Change '+i18n.t("Task")+' State',
      callback: function (e) {
        // user clicked the submit button
        self.model.trigger("task:update:state", $('input[name=opportunityState]:checked').val());
      }
    }).render();
  },

  stateReopen: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.model.trigger("task:update:state", 'open');
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
