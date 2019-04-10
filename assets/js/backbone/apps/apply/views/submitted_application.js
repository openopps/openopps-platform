
const _ = require('underscore');
const Backbone = require('backbone');
var $ = require('jquery');
var ModalComponent = require('../../../components/modal');

var submittedApplication = {
  withdrawApplication: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
  
    if (this.data.submittedAt !== null) {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'withdraw-app',
        alert: 'error',
        action: 'delete',
        modalTitle: 'Withdraw application',
        modalSubtitle: 'Confirm withdrawal of this application.',
        modalBody: '<p>Are you sure you want to withdraw from the ' + this.data.communityName.community_name + ' for ' + 
        this.data.cycleName.name + '? This action cannot be undone.</p>' +
        '<p><strong>Want to keep your application, but choose another internship opportunity?</strong></p>' +
        '<ol><li>Close this window or choose <strong>Cancel</strong>.</li><li>Choose <strong>Update</strong>.</li>' +
        '<li>Search for a new internship opportunity &emdash; you\'ll need to delete one of your selected internships to replace it with a new one.</li>' +
        '<li>Make sure to save and re-submit your application.</li></ol>',
        primary: {
          text: 'Withdraw',
          action: function () {
            _.each(this.data.tasks, function (index) {
              submittedApplication.submitApplicationTasksDelete.bind(index)(index.applicationId, index.taskId);
            });
            _.each(this.data.experience, function (index) {
              submittedApplication.submitApplicationExperienceDelete.bind(index)(index.applicationId, index.experienceId);
            });
            _.each(this.data.reference, function (index) {
              submittedApplication.submitApplicationReferenceDelete.bind(index)(index.applicationId, index.referenceId);
            });
            _.each(this.data.education, function (index) {
              submittedApplication.submitApplicationEducationDelete.bind(index)(index.applicationId, index.educationId);
            });
            _.each(this.data.language, function (index) {
              submittedApplication.submitApplicationLanguageSkillDelete.bind(index)(index.applicationId, index.applicationLanguageSkillId);
            });
            _.each(this.data.skill, function (index) {
              submittedApplication.submitApplicationSkillDelete.bind(index)(index.applicationId, index.id);
            });
            submittedApplication.submitApplicationDelete.bind(this)(this.data.applicationId);
          }.bind(this),
        },
      }).render();
    }
  },

  submitApplicationDelete: function (applicationId) {
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      type: 'DELETE',
      data: {
        applicationId: this.data.applicationId,
      },
    }).done(function ( model, response, options ) {
      this.modalComponent.cleanup();
      Backbone.history.navigate('/home', { trigger: true });
      $('.usajobs-alert--success').show();
      window.scrollTo(0,0);
      $('.toggle-one').attr('data-state', 'is-open');
      $('#section-one').attr('aria-expanded', true);
      $('a[title="Account"]').addClass('is-active');
      $('a[title="Account"] > span').removeClass('usajobs-nav--openopps__section');
      $('a[title="Account"] > span').addClass('usajobs-nav--openopps__section-active');
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationTasksDelete: function (applicationId, taskId) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/task/' + this.taskId,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        taskId: this.taskId,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationExperienceDelete: function (applicationId, experienceId) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/experience/' + this.experienceId,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        experienceId: this.experienceId,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationReferenceDelete: function (applicationId, referenceId) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/reference/' + this.referenceId,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        referenceId: this.referenceId,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationEducationDelete: function (applicationId, educationId) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/Education/' + this.educationId,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        educationId: this.educationId,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationLanguageSkillDelete: function (applicationId, applicationLanguageSkillId) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/applicationLanguageSkill/' + this.applicationLanguageSkillId,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        applicationLanguageSkillId: this.applicationLanguageSkillId,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },

  submitApplicationSkillDelete: function (applicationId, id) {
    $.ajax({
      url: '/api/application/' + this.applicationId + '/applicationSkill/' + this.id,
      type: 'DELETE',
      data: {
        applicationId: this.applicationId,
        id: this.id,
      },
    }).done(function ( model, response, options ) {
      
    }.bind(this)).fail(function (error) {
      this.modalComponent.displayError('An unexpected error occured attempting to withdraw this application.', 'Withdraw application error');
    }.bind(this));
  },
};

module.exports = submittedApplication;