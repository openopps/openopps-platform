var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Bootstrap = require('bootstrap');
var Backbone = require('backbone');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');
var marked = require('marked');
var TimeAgo = require('../../../../../vendor/jquery.timeago');

var BaseView = require('../../../../base/base_view');
var UIConfig = require('../../../../config/ui.json');
var ModalComponent = require('../../../../components/modal');

var TaskShowTemplate = require('../templates/task_show_item_template.html');
var ProgressTemplate = require('../templates/task_progress_template.html');
var AlertTemplate = require('../../../../components/alert_template.html');
var NextStepTemplate = require('../templates/next_step_template.html');
var RemoveParticipantTemplate = require('../templates/remove_participant_template.html');
var ConfirmParticipantTemplate = require('../templates/confirm_participant_template.html');
var NotCompleteTemplate = require('../templates/participants_not_complete_template.html');
var ParticipateCheckList = require('../templates/participate_check_list.html').toString();
var ContractorCheckList = require('../templates/contractor_check_list.html').toString();
var ProfileCheckList = require('../templates/profile_check_list.html');
var ShareTemplate = require('../templates/task_share_template.txt');


var TaskItemView = BaseView.extend({
  events: {
    'click #accept-toggle'            : 'toggleAccept',
    'click #apply'                    : 'apply',
    'click #apply-cancel'             : 'cancelApply',
    'click #nextstep'                 : 'nextstep',
    'click #complete'                 : 'complete',
    'click #task-cancel'              : 'cancel',
    'click .project-people__assign'   : 'assignParticipant',
    'click .project-people__confirm'  : 'confirmParticipant',
    'click .project-people__remove'   : 'removeParticipant',
    'click .usa-accordion-button'     : 'toggleAccordion',
    'click .task-complete'            : 'taskComplete',
  },

  modalOptions: {
    el: '#site-modal',
    id: 'volunteer',
    modalTitle: '',
    modalBody: '',
    disableClose: false,
    secondary: { },
    primary: { },
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.render();
    $('#search-results-loading').hide();
  },

  render: function () {
    var taskState = this.model.attributes.state;

    if (_.isString(taskState)) {
      taskState = taskState.charAt(0).toUpperCase() + taskState.slice(1);
    }

    this.data = {
      user: window.cache.currentUser,
      model: this.model.toJSON(),
      tags: this.model.toJSON().tags,
      state: {
        humanReadable: taskState,
        value: taskState.toLowerCase(),
      },
      hasStep: this.hasStep.bind(this),
      accordion: {
        show: false,
        open: false,
      },
      fromSearch: this.params.has('fromSearch'),
    };

    if (['in progress', 'completed', 'canceled'].indexOf(taskState.toLowerCase()) > -1) {
      this.data.accordion.show = true;
    }

    this.data['madlibTags'] = organizeTags(this.data.tags);
    _.each(['description', 'details', 'outcome', 'about'], function (part) {
      if(this.data.model[part]) {
        this.data.model[part + 'Html'] = marked(this.data.model[part]);
      }
    }.bind(this));
    this.model.trigger('task:tag:data', this.tags, this.data['madlibTags']);

    var d = this.data,
        vol = ((!d.user || d.user.id !== d.model.userId) &&
        (d.model.volunteer || 'open' === d.model.state));

    this.data.ui = UIConfig;
    this.data.vol = vol;
    this.data.model.userId = this.data.model.owner.id;
    this.data.model.owner.initials = getInitials(this.data.model.owner.name);
    var compiledTemplate = _.template(TaskShowTemplate)(this.data);

    this.$el.html(compiledTemplate);
    
    // $('#search-results-loading').hide();
    this.$el.localize();
    if(taskState.toLowerCase() == 'in progress' && this.data.model.acceptingApplicants) {
      this.updatePill('in progress', true);
    }
    $('time.timeago').timeago();
    this.updateTaskEmail();
    this.model.trigger('task:show:render:done');
    this.initializeProgress();

    if (window.cache.currentUser && this.params.get('action') == 'apply' && !this.model.attributes.volunteer) {
      $('#apply').click();

      Backbone.history.navigate(window.location.pathname, {
        trigger: false,
        replace: true,
      });
    }
    $('#search-results-loading').hide();
  },

  initializeProgress: function () {
    $('#rightrail').html(_.template(ProgressTemplate)(this.data));
    this.initializeStateButtons();
    this.$('#task-search-spinner').hide();
  },

  initializeStateButtons: function () {
    if(this.data.model.canEditTask) {
      $('#nextstep').hide();
      $('#complete').hide();
      switch (this.model.attributes.state.toLowerCase()) {
        case 'open':
        case 'not open':
          $('#nextstep').show();
          break;
        case 'in progress':
          $('#complete').show();
          break;
      }
    }
  },

  hasStep: function (step) {
    switch (step) {
      case 'assigning':
        return _.contains(['open', 'not open', 'in progress', 'completed'], this.data.state.value);
      case 'inProgress':
        return _.contains(['in progress', 'completed'], this.data.state.value);
      case 'complete':
        return this.data.state.value === 'completed';
      default:
        return false;
    }
  },

  updateTaskEmail: function () {
    var subject = 'Take a look at this opportunity',
        data = {
          opportunityTitle: this.model.get('title'),
          opportunityLink: window.location.protocol +
          '//' + window.location.host + '' + window.location.pathname,
          opportunityDescription: this.model.get('description'),
          opportunityMadlibs: $('<div />', {
            html: this.$('#task-show-madlib-description').html(),
          }).text().replace(/\s+/g, ' '),
          opportunityWhatYoullDo: this.model.get('details'),
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
  },

  toggleAccordion: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion.open = !this.data.accordion.open;
    element.attr('aria-expanded', this.data.accordion.open);
    element.siblings('.usa-accordion-content').attr('aria-hidden', !this.data.accordion.open);
  },

  updatePill: function (state, toggleOn) {
    var status = (state == 'in progress' && !toggleOn) ? 'status-open' : 'status-' + this.data.state.value.replace(' ', '-');
    var pillElem = $('.' + status);
    pillElem.removeClass(status);
    this.data.state = {
      humanReadable: state.charAt(0).toUpperCase() + state.slice(1),
      value: state,
    };
    this.data.model.state = state;
    this.model.attributes.state = state;
    pillElem.addClass((state == 'in progress' && toggleOn) ? 'status-open' : 'status-' + this.data.state.value.replace(' ', '-'));
    pillElem.html((state == 'in progress' && toggleOn) ? 'Open' : this.data.state.humanReadable);
  },

  toggleAccept: function (e) {
    var toggleOn = $(e.currentTarget).hasClass('toggle-off');
    var state = this.model.attributes.state.toLowerCase();
    if(state == 'open' && !toggleOn) {
      state = 'not open';
    } else if (state == 'not open' && toggleOn) {
      state = 'open';
    }
    $.ajax({
      url: '/api/task/state/' +  this.model.attributes.id,
      type: 'PUT',
      data: {
        id: this.model.attributes.id,
        state: state,
        acceptingApplicants: toggleOn,
      },
      success: function (data) {
        if(toggleOn) {
          $(e.currentTarget).removeClass('toggle-off');
        } else {
          $(e.currentTarget).addClass('toggle-off');
        }
        this.updatePill(state, toggleOn);
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  taskComplete: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    var complete = $(e.currentTarget).data('behavior') == 'complete';
    $.ajax({
      url: '/api/volunteer/complete',
      type: 'POST',
      data: {
        taskId: this.model.attributes.id,
        volunteerId: $(e.currentTarget).data('volunteerid'),
        complete: complete,
      },
      success: function (data) {
        _.findWhere(this.data.model.volunteers, { id: data.id }).taskComplete = complete;
        this.initializeProgress();
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  removeParticipant: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    if (this.data.state.value == 'in progress') {
      var volunteerid = $(e.currentTarget).data('volunteerid');
      var participant = _.findWhere(this.data.model.volunteers, { id: volunteerid });
      var options = _.extend(_.clone(this.modalOptions), {
        modalTitle: 'Are you sure you want to remove this participant?',
        modalBody: _.template(RemoveParticipantTemplate)(participant),
        secondary: {
          text: 'Cancel',
          action: function () {
            this.modalComponent.cleanup();
          }.bind(this),
        },
        primary: {
          text: 'Confirm',
          action: function () {
            this.modalComponent.cleanup();
            this.assignParticipant(e);
          }.bind(this),
        },
      });
      this.modalComponent = new ModalComponent(options).render();
    } else {
      this.assignParticipant(e);
    }
  },

  assignParticipant: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    var assign = $(e.currentTarget).data('behavior') == 'assign';
    $.ajax({
      url: '/api/volunteer/assign',
      type: 'POST',
      data: {
        taskId: this.model.attributes.id,
        volunteerId: $(e.currentTarget).data('volunteerid'),
        assign: assign,
      },
      success: function (data) {
        _.findWhere(this.data.model.volunteers, { id: data.id }).assigned = assign;
        this.initializeProgress();
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  confirmParticipant: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    var volunteerid = $(e.currentTarget).data('volunteerid');
    var participant = _.findWhere(this.data.model.volunteers, { id: volunteerid });
    var options = _.extend(_.clone(this.modalOptions), {
      modalTitle: 'Are you sure you want to assign this participant?',
      modalBody: _.template(ConfirmParticipantTemplate)(participant),
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Confirm',
        action: function () {
          this.modalComponent.cleanup();
          this.assignParticipant(e);
        }.bind(this),
      },
    });
    this.modalComponent = new ModalComponent(options).render();
  },

  nextstep: function (e) {
    var state = 'in progress';
    var nxtBtnDisable = $('#nextstep').hasClass('disabled');  
    if(!nxtBtnDisable){
      $.ajax({
        url: '/api/task/state/' +  this.model.attributes.id,
        type: 'PUT',
        data: {
          id: this.model.attributes.id,
          state: state,
          acceptingApplicants: false,
        },
        success: function (data) {
          this.updatePill(state);
          this.model.attributes.acceptingApplicants = false;
          this.data.model.acceptingApplicants = false;
          this.data.accordion.show = true;
          this.initializeProgress();
          var options = _.extend(_.clone(this.modalOptions), {
            modalTitle: 'Let\'s get started',
            modalBody: NextStepTemplate,
            primary: {
              text: 'Okay',
              action: function () {
                this.modalComponent.cleanup();
              }.bind(this),
            },
          });
          this.modalComponent = new ModalComponent(options).render();
        }.bind(this),
        error: function (err) {
        // display modal alert type error
        }.bind(this),
      });
    }
  },

  complete: function (e) {   
    var btnDisable=$('#complete').hasClass('disabled');  
    var notComplete = _.where(this.data.model.volunteers, { assigned: true, taskComplete: false });
    if(notComplete.length > 0 && !btnDisable) {
      var options = _.extend(_.clone(this.modalOptions), {
        modalTitle: 'Not complete',
        modalBody: _.template(NotCompleteTemplate)({ volunteers: notComplete }),
        secondary: {
          text: 'Cancel',
          action: function () {
            this.modalComponent.cleanup();
          }.bind(this),
        },
        primary: {
          text: 'Confirm',
          action: function () {
            this.modalComponent.cleanup();
            this.markComplete();
          }.bind(this),
        },
      });
      this.modalComponent = new ModalComponent(options).render();
    } else {
      if(!btnDisable){
        this.markComplete();
      }
    }
  },

  markComplete: function () {
    var state = 'completed';
    $.ajax({
      url: '/api/task/state/' +  this.model.attributes.id,
      type: 'PUT',
      data: {
        id: this.model.attributes.id,
        state: state,
        acceptingApplicants: false,
      },
      success: function (data) {
        this.updatePill(state);
        this.model.attributes.acceptingApplicants = false;
        this.data.model.acceptingApplicants = false;
        this.model.attributes.state = 'completed';
        this.data.model.state = 'completed';
        this.model.attributes.completedAt = new Date();
        this.data.model.completedAt = new Date();
        this.data.accordion.show = true;
        this.data.accordion.open = false;
        this.data.accordion.open = false;
        $('#task-edit').remove();
        this.initializeProgress();
        var options = _.extend(_.clone(this.modalOptions), {
          modalTitle: 'Congratulations!',
          modalBody: 'You\'ve successfully completed <strong>' + this.model.attributes.title +
            '</strong>. We updated your profile with your achievement. Don\'t forget to thank ' +
            'your participants for a job well done.',
          primary: {
            text: 'Done',
            action: function () {
              this.modalComponent.cleanup();
            }.bind(this),
          },
        });
        this.modalComponent = new ModalComponent(options).render();
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  cancel: function (e) {
    if (e.preventDefault) e.preventDefault();
    var options = _.extend(_.clone(this.modalOptions), {
      modalTitle: 'Are you sure you want to cancel this opportunity?',
      modalBody: 'If you cancel this opportunity, you and your participants will not receive any credit for the work.',
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Confirm',
        action: function () {
          this.cancelOpportunity();
          this.modalComponent.cleanup();
        }.bind(this),
      },
    });
    this.modalComponent = new ModalComponent(options).render();
  },

  cancelOpportunity: function () {
    var state = 'canceled';
    $.ajax({
      url: '/api/task/state/' +  this.model.attributes.id,
      type: 'PUT',
      data: {
        id: this.model.attributes.id,
        state: state,
        acceptingApplicants: false,
      },
      success: function (data) {
        this.updatePill(state);
        this.model.attributes.acceptingApplicants = false;
        this.data.model.acceptingApplicants = false;
        this.model.attributes.state = 'canceled';
        this.data.model.state = 'canceled';
        this.model.attributes.canceledAt = new Date();
        this.data.model.canceledAt = new Date();
        this.data.accordion.show = true;
        this.data.accordion.open = false;
        $('#task-edit').html('<i class="fas fa-edit"></i> Reopen');
        this.initializeProgress();
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  apply: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?tasks/' + this.model.attributes.id + '?action=apply', { trigger: true });
    } else {
      var locationTag = window.cache.currentUser.tags.filter(function (t) {
        return t.type === 'location';
      });
      var agency = window.cache.currentUser.agency;
      if(locationTag.length == 0 || !agency) {
        this.completeProfile(locationTag, agency);
      } else {
        this.renderApplyModal(e);
      }
    }
  },

  renderApplyModal: function (e) {
    var skill = _.find(window.cache.currentUser.tags, function (tag) {
      return tag.type == 'skill';
    });
    var options = _.extend(_.clone(this.modalOptions), {
      modalTitle: 'Do you want to participate?',
      modalBody: _.template(ParticipateCheckList)({e, skill}),
      primary: {
        text: 'Yes, submit my name',
        action: this.volunteer.bind(this),
      },
    });
    var taskAgencyRestriction = _.findWhere(this.model.get('agencies'), { agency_id: this.model.get('restrictedTo')});
    var isAgencyEmployee = !_.isEmpty(_.findWhere(window.cache.currentUser.agencies, { agency_id: this.model.get('restrictedTo')}));
    if (window.cache.currentUser.hiringPath == 'contractor' || (taskAgencyRestriction && !isAgencyEmployee) ) {
      options.modalTitle = 'Sorry you are not eligble to apply.';
      options.modalBody = _.template(ContractorCheckList)({
        hiringPath: window.cache.currentUser.hiringPath,
        isAgencyEmployee: isAgencyEmployee,
        agency: taskAgencyRestriction,
      });
      options.primary = {
        text: 'Close',
        action: function () { this.modalComponent.cleanup(); }.bind(this),
      };
    }
    this.modalComponent = new ModalComponent(options).render();
  },

  cancelApply: function (e) {
    if (e.preventDefault) e.preventDefault();
    $.ajax({
      url: '/api/volunteer/delete',
      type: 'POST',
      data: {
        taskId: this.model.attributes.id,
      },
    }).done(function (data) {
      this.data.model.volunteers = _.reject(this.data.model.volunteers, { userId: data.userId });
      this.initializeProgress();
      var options = _.extend(_.clone(this.modalOptions), {
        modalTitle: 'Cancel your application',
        modalBody: 'Your application has been withdrawn.',
        primary: {
          text: 'Okay',
          action: function () {
            this.modalComponent.cleanup();
          }.bind(this),
        },
      });
      this.modalComponent = new ModalComponent(options).render();
    }.bind(this));
  },

  completeProfile: function (locationTag, agency) {
    var options = _.extend(_.clone(this.modalOptions), {
      modalTitle: 'Please complete your profile.',
      modalBody: _.template(ProfileCheckList)({ locationTag: locationTag, agency: agency }),
      primary: {
        text: loginGov ? 'Update profile at USAJOBS.gov' : 'Go to profile',
        action: function () {
          this.modalComponent.cleanup();
          if (loginGov) { 
            window.location = usajobsURL + '/Applicant/Profile/';
          } else {
            Backbone.history.navigate('/profile/' + window.cache.currentUser.id, { trigger: true });
          }
        }.bind(this),
      },
    });
    this.modalComponent = new ModalComponent(options).render();
  },

  volunteer: function () {
    $.ajax({
      url: '/api/volunteer/',
      type: 'POST',
      data: {
        taskId: this.model.attributes.id,
      },
    }).done( function (data) {
      if(!_.findWhere(this.data.model.volunteers, { userId: data.userId })) {
        this.data.model.volunteers.push(data);
        this.initializeProgress();
      }
      this.modalComponent.cleanup();
    }.bind(this));
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = TaskItemView;
