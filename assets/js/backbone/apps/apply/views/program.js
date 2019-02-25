var $ = require('jquery');
const templates = require('./templates');

module.exports = {};

module.exports.deleteProgram = function (e) {
  e.preventDefault && e.preventDefault();
  $.ajax({
    url: '/api/application/' + this.data.applicationId + '/task/' + e.currentTarget.dataset.taskId,
    method: 'DELETE',
  }).done(function () {
    this.data.tasks.splice(e.currentTarget.dataset.index, 1);
    this.data[['firstChoice', 'secondChoice', 'thirdChoice'][e.currentTarget.dataset.index]] = null;
    this.$el.html(templates.getTemplateForStep(1)(this.data));
  }.bind(this)).fail(function () {
    showWhoopsPage();
  });
};