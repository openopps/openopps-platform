var $ = require('jquery');
const charcounter = require('../../../../vendor/jquery.charcounter');
const marked = require('marked');
const templates = require('./templates');

var ApplyView = require('./apply_view');

var statement = {
  characterCount: function () {
    $('#statement').charCounter(2500, {
      container: '#statement-count',
    });
  },

  cancel: function () {
    this.$el.html(templates.applyLanguage(this.data));
  },

  statementContinue: function () {
    this.data.currentStep = 6;
    this.data.selectedStep = 6;
    $.ajax({
      url: '/api/application/' + this.data.applicationId,
      method: 'PUT',
      data: {
        applicationId: this.data.applicationId,
        currentStep: 6,
        statementOfInterest: $('#statement').val(),
        updatedAt: this.data.updatedAt,
      },
    }).done(function (result) {
      this.data.updatedAt = result.updatedAt;
      this.data.statementOfInterest = result.statementOfInterest;
      this.data.statementOfInterestHtml = marked(this.data.statementOfInterest);
      this.$el.html(templates.applyReview(this.data));
      this.$el.localize();
      ApplyView.renderProcessFlowTemplate({ currentStep: 6, selectedStep: 6 });
      window.scrollTo(0, 0);
    }.bind(this));
  },
};

module.exports = statement;