var UIConfig = require('../config/ui.json');
var _ = require('underscore');
var ShowMarkdown = require('../components/show_markdown');

module.exports = {
  initializeShowMarkdown: function (options) {
    if (this.defaultDescription) { this.defaultDescription.cleanup(); }
    var data = (UIConfig.fullTimeDetail && UIConfig.fullTimeDetail.description) ? UIConfig.fullTimeDetail.description : undefined;
    if (data) {
      options = _.extend(options, { data: data });
      this.defaultDescription = new ShowMarkdown(options).render();
      var descr = this.$('input[name="task-time-required"]:checked').attr('data-descr');
      this.defaultDescription.showHide(descr);
    }
  },

  timeRequiredChanged: function (e) {
    e.preventDefault();
    if (this.defaultDescription) {
      var descr = this.$(e.currentTarget).attr('data-descr');
      this.defaultDescription.showHide(descr);
    }
    return this;
  },

};
