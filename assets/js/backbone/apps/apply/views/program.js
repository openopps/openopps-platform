const $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');
const ModalComponent = require('../../../components/modal');
const actions = { up: -1, down: 1 };

function onError (error) {
  this.modalComponent = new ModalComponent({
    el: '#site-modal',
    id: 'sort-programs',
    alert: 'error',
    modalTitle: 'An unexpected error occured',
    modalBody: 'An unexpected error occured attempting to update your internship selections from your application.',
    primary: null,
    secondary: null,
  }).render();
}

function onSuccess (results) {
  this.data.tasks = results;
  this.data.firstChoice = _.findWhere(this.data.tasks, { sortOrder: 1 });
  this.data.secondChoice = _.findWhere(this.data.tasks, { sortOrder: 2 });
  this.data.thirdChoice = _.findWhere(this.data.tasks, { sortOrder: 3 });
  this.$el.html(templates.getTemplateForStep(1)(this.data));
  this.$el.localize();
}

function swapPrograms (program1, program2) {
  $.ajax({
    url: '/api/application/' + this.data.applicationId + '/task/swap',
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify([ program1, program2 ]),
  }).done(onSuccess.bind(this)).fail(onError.bind(this));
}

module.exports = {};

module.exports.deleteProgram = function (e) {
  e.preventDefault && e.preventDefault();
  $.ajax({
    url: '/api/application/' + this.data.applicationId + '/task/' + e.currentTarget.dataset.taskId,
    method: 'DELETE',
  }).done(function () {
    var sort = parseInt(e.currentTarget.dataset.sort);
    var index = _.findIndex(this.data.tasks, { sortOrder: sort });
    this.data.tasks.splice(index, 1);
    this.data[['firstChoice', 'secondChoice', 'thirdChoice'][sort - 1]] = null;
    this.$el.html(templates.getTemplateForStep(1)(this.data));
  }.bind(this)).fail(function () {
    showWhoopsPage();
  });
};

module.exports.moveProgram = function (e) {
  var action = e.currentTarget.dataset.action;
  var sort = parseInt(e.currentTarget.closest('.usajobs-card--large').dataset.sort);
  var program1 = _.findWhere(this.data.tasks, { sortOrder: sort });
  var program2 = _.findWhere(this.data.tasks, { sortOrder: (sort + actions[action]) });
  swapPrograms.bind(this)(program1, program2);
};