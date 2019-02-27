var $ = require('jquery');
const ModalComponent = require('../../../components/modal');

function onFailure (error) {
  this.modalComponent.cleanup();
  showWhoopsPage();
}

function onSuccess (results) {
  this.modalComponent.cleanup();
  this.data.education = results.education;
  this.data.experience = results.experience;
  this.data.reference = results.reference;
  this.data.language = results.language;
  if (results.error) {
    showImportErrorMessage.bind(this)();
  } else {
    this.updateApplicationStep(1);
  }
}

function showImportErrorMessage (action) {
  this.modalComponent = new ModalComponent({
    el: '#site-modal',
    id: 'import-profile',
    alert: 'error',
    primary: {
      text: 'Continue with application',
      action: function () {
        this.modalComponent.cleanup();
        this.updateApplicationStep(1);
      }.bind(this),
    },
    secondary: {},
    disableClose: true,
    modalTitle: 'An unexpected error occured',
    modalBody: 'An error has occurred attempting to import some of your USAJOBS profile data. Please verify all entries for completeness and correctness before submitting our application.',
  }).render();
}

function startProfileImport () {
  this.modalComponent = new ModalComponent({
    el: '#site-modal',
    id: 'import-profile',
    modalTitle: 'Importing data from USAJOBS',
    modalBody: 'Please wait while we import your work experience, references, education, and languages from your USAJOBS profile.',
    primary: null,
    secondary: {},
    disableClose: true,
  }).render();
  $.ajax({
    url: '/api/application/' + this.data.applicationId + '/import',
    method: 'POST',
    data: {
      applicationId: this.data.applicationId,
    },
  }).done(onSuccess.bind(this)).fail(onFailure.bind(this));
}

var nextSteps = {
  importProfileData: startProfileImport,
};

module.exports = nextSteps;