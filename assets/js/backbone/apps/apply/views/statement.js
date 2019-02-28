var $ = require('jquery');
const charcounter = require('../../../../vendor/jquery.charcounter');
const marked = require('marked');
const templates = require('./templates');

var statement = {
  characterCount: function () {
    $('#statement').charCounter(2500, {
      container: '#statement-count',
    });
  },

  statementContinue: function () {
    if(!this.validateFields()) {
      this.data.currentStep = Math.max(this.data.currentStep, 5);
      this.data.selectedStep = 6;
      $.ajax({
        url: '/api/application/' + this.data.applicationId,
        method: 'PUT',
        data: {
          applicationId: this.data.applicationId,
          statementOfInterest: $('#statement').val(),
          updatedAt: this.data.updatedAt,
        },
      }).done(function (result) {
        this.data.updatedAt = result.updatedAt;
        this.data.statementOfInterest = result.statementOfInterest;
        this.data.statementOfInterestHtml = marked(this.data.statementOfInterest);
        this.$el.html(templates.applyReview(this.data));
        this.$el.localize();
        this.updateApplicationStep(6);
        window.scrollTo(0, 0);
      }.bind(this));
    }
  },
};

module.exports = statement;