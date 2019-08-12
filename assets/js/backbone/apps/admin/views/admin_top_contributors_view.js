var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var Modal = require('../../../components/modal');

// templates
var AdminTopContributorsTemplate = require('../templates/admin_dashboard_top_contributors_template.html');

var AdminTopContributorsView = Backbone.View.extend({
  events: {
    // 'click .class'            : '',
  },

  initialize: function (options) {
    this.options = options;
    // this.data = {
    //   page: 1,
    // };  
    // this.agency = {};
    // this.community = {};
    // this.baseModal = {
    //   el: '#site-modal',
    //   secondary: {
    //     text: 'Cancel',
    //     action: function () {
    //       this.modalComponent.cleanup();
    //     }.bind(this),
    //   },
    // };
  },

  render: function () {
    var template = _.template(AdminTopContributorsTemplate)({});
    this.$el.html(template);
    // $('[data-target=' + (this.options.target).toLowerCase() + ']').addClass('is-active');
    // this.loadData();
    // return this;
  },

  loadData: function () {
    var url = '/api/admin';
    if (this.options.target !== 'sitewide') {
      url += '/' + this.options.target + '/' + this.options.targetId;
    }
    url += '/tasks';
    $.ajax({
      url: url,
      data: this.data,
      dataType: 'json',
      success: function (data) {
        this.tasks = data;    
        data.agency = this.agency;
        data.community= this.community;   
        var template = _.template(AdminTopContributorsTemplate)(data);
        $('#search-results-loading').hide();
        this.$el.html(template);
        this.$el.show();
        this.renderTasks(this.tasks);
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
