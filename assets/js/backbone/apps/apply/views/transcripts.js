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

module.exports.upload = function () {
  $('#upload-transcript').hide();
  $('#refresh-transcripts').show();
};
module.exports.renderTranscripts= function (){ 
  $('#transcript-preview-id').html(templates.applyTranscript(this.data));
  if(this.data.transcripts.length && this.data.transcripts.length==1){    
    $('input[name=transcripts][id=' + this.data.transcripts[0].CandidateDocumentID +']').prop('checked', true);
  }
}; 