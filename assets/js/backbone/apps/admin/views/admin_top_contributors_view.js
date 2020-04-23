var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var Modal = require('../../../components/modal');

// templates
var AdminTopContributorsTemplate = require('../templates/admin_dashboard_top_contributors_template.html');
var AdminAgenciesTopContributorsTemplate = require('../templates/admin_agencies_dashboard_top_contributors_template.html');

var AdminTopContributorsView = Backbone.View.extend({
  events: {
    // 'click .class' : '',
  },

  initialize: function (options) {
    this.options = options;
    this.dataUrl = '/api/admin/contributors';
    if (this.options.target !== 'sitewide') {
      this.dataUrl = '/api/admin/' + this.options.target + '/' + this.options.targetId + '/contributors';
    }
    this.dataExportCreatedUrl = '/api/admin/export/contributor/created/';
    if (this.options.target !== 'sitewide') {
      this.dataExportCreatedUrl = '/api/admin/export/' + this.options.target + '/' + this.options.targetId + '/contributor/created';
    }
    this.dataExportParticipantUrl = '/api/admin/export/contributor/participant/';
    if (this.options.target !== 'sitewide') {
      this.dataExportParticipantUrl = '/api/admin/export/' + this.options.target + '/' + this.options.targetId + '/contributor/participant';
    }
  },

  render: function () {
    this.loadData();
  },

  loadData: function () {
    $.ajax({
      url: this.dataUrl,
      dataType: 'json',
      success: function (data) {
        data.dataExportCreatedUrl = this.dataExportCreatedUrl;
        data.dataExportParticipantUrl = this.dataExportParticipantUrl;
        this.contributors = data;
        var template = _.template(AdminTopContributorsTemplate);
        if (this.options.target != 'sitewide') {
          template = _.template(AdminAgenciesTopContributorsTemplate);
        }
        $('#search-results-loading').hide();
        this.$el.html(template(data));
        this.$el.show();
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
      },
    });
    return this;
  },
  
  cleanup: function () {
    removeView(this);
  },
});

module.exports = AdminTopContributorsView;
