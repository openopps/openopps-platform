
const _ = require('underscore');
const Backbone = require('backbone');
var $ = require('jquery');
var ModalComponent = require('../../../components/modal');
const moment = require('moment-timezone');

var submittedApplication = {
  updateApplication: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
 
    if (this.data.submittedAt !== null) {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'update-app',
        modalTitle: 'Update application',
        modalBody: '<p>You are about to make edits to an application you have already submitted. Follow these steps to resubmit your application:</p> ' +
        '<ol><li>Go to the page you want to edit by using the progress bar at the top of the page or by clicking the <strong>Save and continue</strong> ' +
        'button on each page.</li><li>Click <strong>Save and continue</strong> once you make your change.</li><li>Click <strong>Save and continue</strong> ' +
        'on all of the pages following the page you edited (you don\'t have to <strong>Save and continue</strong> on any previous pages).</li><li>Review ' +
        'your application and click <strong>Submit application</strong>. You must submit changes before '+ moment.tz(this.data.cycle.apply_end_date, 'America/New_York').format('MMMM DD, YYYY') +' at 11:59 p.m. ET.</li></ol>',
        primary: {
          text: 'Update application',
          action: function () {
            this.data.submittedAt = null;
            this.data.selectedStep = 1;
            Backbone.history.navigate('apply/' + this.data.applicationId, { trigger: false });
            this.render();
            this.modalComponent.cleanup();
          }.bind(this),
        },
      }).render();
    }
  },

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
        this.data.cycle.name + '? This action cannot be undone.</p>' +
        '<p><strong>Want to keep your application, but choose another internship opportunity?</strong></p>' +
        '<ol><li>Close this window or choose <strong>Cancel</strong>.</li><li>Choose <strong>Update</strong>.</li>' +
        '<li>Search for a new internship opportunity &mdash; you\'ll need to delete one of your selected internships to replace it with a new one.</li>' +
        '<li>Make sure to save and re-submit your application.</li></ol>',
        primary: {
          text: 'Withdraw',
          action: function () {
            submittedApplication.submitWithdraw.bind(this)(this.data.applicationId, this.data.userId);
          }.bind(this),
        },
      }).render();
    }
  },

  submitWithdraw: function (applicationId, userId) {
    $.ajax({
      url: '/api/application/' + applicationId,
      type: 'PUT',
      data: {
        applicationId: applicationId,
        cycleId: this.data.cycleId,
        withdrawn: true,
        withdrawnAt: (new Date()).toISOString(),
        updatedAt: this.data.updatedAt,
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

  submitDelete: function (applicationId, userId) {
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      type: 'DELETE',
      data: {
        applicationId: this.data.applicationId,
        userId: this.data.userId,
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
};

module.exports = submittedApplication;