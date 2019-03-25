const $ = require('jquery');
const _ = require('underscore');
const Backbone = require('backbone');
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
  this.render();
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

module.exports.getSavedOpportunities = function () {
  $.ajax({
    url: '/api/task/saved',
    dataType: 'json',
    success: function (data) {  
      this.data.savedOpportunities = data;
    }.bind(this),
  });
},

module.exports.saveProgramContinue = function (e) {
  e.preventDefault && e.preventDefault();
  var emptySelections = $('.program-empty');
  if (emptySelections.length > 0) {
    _.each(emptySelections, function (selection) {
      $(selection.parentElement).addClass('usa-input-error');
    });
    emptySelections[0].scrollIntoView();
  } else {
    if (this.data.currentStep < 2) {
      $.ajax({
        url: '/api/application/' + this.data.applicationId,
        method: 'PUT',
        data: {
          applicationId: this.data.applicationId,
          currentStep: 2,
          updatedAt: this.data.updatedAt,
        },
      }).done(function () {
        Backbone.history.navigate(window.location.pathname + '?step=2', { trigger: true });
      }.bind(this)).fail(function () {
        showWhoopsPage();
      });
    } else {
      this.updateApplicationStep(2);
    }
  }
};

module.exports.deleteProgram = function (e) {
  e.preventDefault && e.preventDefault();
  $.ajax({
    url: '/api/application/' + this.data.applicationId + '/task/' + e.currentTarget.getAttribute('data-task-id'),
    method: 'DELETE',
  }).done(function (result) {
    var sort = parseInt(e.currentTarget.getAttribute('data-sort'));
    var index = _.findIndex(this.data.tasks, { sortOrder: sort });
    this.data.tasks.splice(index, 1);
    this.data[['firstChoice', 'secondChoice', 'thirdChoice'][sort - 1]] = null;
    this.data.currentStep = 1;
    this.data.updatedAt = result.updatedAt;
    this.render();
  }.bind(this)).fail(function () {
    showWhoopsPage();
  });
};

module.exports.moveProgram = function (e) {
  var action = e.currentTarget.getAttribute('data-action');
  var sort = parseInt($(e.currentTarget).closest('.usajobs-card--large')[0].getAttribute('data-sort'));
  var program1 = _.findWhere(this.data.tasks, { sortOrder: sort });
  var program2 = _.findWhere(this.data.tasks, { sortOrder: (sort + actions[action]) });
  swapPrograms.bind(this)(program1, program2);
};