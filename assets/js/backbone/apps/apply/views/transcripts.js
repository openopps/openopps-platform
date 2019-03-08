const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
const ModalComponent = require('../../../components/modal');

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
    this.render();
  }.bind(this)).fail(function () {
    showWhoopsPage();
  });
};

module.exports.upload = function () {
  $('#upload-transcript').hide();
  $('#refresh-transcripts').show();
};