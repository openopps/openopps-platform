var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var Modal = require('../../../components/modal');

// templates
var AdminTopContributorsTemplate = require('../templates/admin_dashboard_top_contributors_template.html');

var AdminTopContributorsView = Backbone.View.extend({
  events: {
    // 'click .class' : '',
  },

  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    this.loadData();
    // var template = _.template(AdminTopContributorsTemplate)({});
    // this.$el.html(template);
  },

  loadData: function () {
    $.ajax({
      url: '/api/admin/contributors',
      dataType: 'json',
      success: function (data) {
        this.contributors = data;   
        var template = _.template(AdminTopContributorsTemplate)(data);
        $('#search-results-loading').hide();
        this.$el.html(template);
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
