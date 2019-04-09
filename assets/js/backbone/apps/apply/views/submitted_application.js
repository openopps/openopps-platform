
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
            submittedApplication.submitDelete.bind(this)(this.data.applicationId);
          }.bind(this),
        },
      }).render();
    }
  },

  submitDelete: function (applicationId) {
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
};

module.exports = submittedApplication;