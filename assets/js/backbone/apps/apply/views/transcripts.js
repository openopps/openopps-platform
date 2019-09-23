const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const ModalComponent = require('../../../components/modal');
const templates = require('./templates');

module.exports = {};

module.exports.refresh = function (e) {
  e.preventDefault && e.preventDefault();
  $('#refresh-transcripts').hide();
  $('#refreshing-transcripts').show();
  $.ajax({
    url: '/api/application/user/transcripts',
    method: 'GET',
  }).done(function (transcripts) { 
    this.data.transcripts = transcripts;  
    module.exports.renderTranscripts.bind(this)();
 
  }.bind(this)).fail(function () {
    showWhoopsPage();
  });
 
  
};

module.exports.upload = function (e) { 
  if (e.preventDefault) e.preventDefault();
  if (this.modalComponent) { this.modalComponent.cleanup(); }
  this.modalComponent = new ModalComponent({
    el: '#site-modal',
    id: 'upload-trans',
    modalTitle: 'Upload Transcript',
    modalBody: '<p>To upload a transcript, first you need to add it to your USAJOBS profile. Follow these steps:</p> ' +
      '<ol><li>Click <strong>Continue—</strong> we\'ll send you to your profile in USAJOBS. This will be a new tab in your browser. ' +
      '</li><li>Click <strong>Upload document—</strong> you\'ll get another pop-up window.</li><li>Choose the transcript you want to upload and change the name if needed.' +
      '</li><li>Select <strong> Transcript </strong> as the document type.</li><li>Click <strong>Complete Upload—</strong> you\'ll see the new transcript in your USAJOB profile.'+
      '</li><li>Go back to the browser tab that says <strong>Open Opportunities.</strong></li><li>Go to the Transcript section and click <strong>Refresh transcripts—</strong> you will see the new transcript you uploaded.'+
      '</li><li>Select the transcript you want to include in your application.</li><li>Click <strong>Save and continue</strong> to finish your application.</li></ol>',
    primary: {
      text: 'Continue',
      action: function () {      
        window.open(usajobsURL + '/Applicant/ProfileDashboard/OtherDocuments/');          
        $('#upload-transcript').hide();
        $('#refresh-transcripts').show();
        this.modalComponent.cleanup();
      }.bind(this),
    },
  }).render();
  
  
};
module.exports.renderTranscripts= function (){ 
  $('#transcript-preview-id').html(templates.applyTranscript(this.data));
  if(this.data.transcripts.length && this.data.transcripts.length==1){    
    $('input[name=transcripts][id=' + this.data.transcripts[0].CandidateDocumentID +']').prop('checked', true);
  }
}; 