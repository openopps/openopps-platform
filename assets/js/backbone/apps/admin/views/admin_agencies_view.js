var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminAgenciesTemplate = require('../templates/admin_agencies_template.html');

var AdminAgenciesView = Backbone.View.extend({

  events: {
    'click .link' : 'link',
    'change #agencies' : 'changeAgency',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.agencyId = options.agencyId || window.cache.currentUser.agency.id;
  },

  render: function (replace) {
    this.$el.show();
    // get meta data for agency
    $.ajax({
      url: '/api/admin/agency/' + this.agencyId,
      dataType: 'json',
      success: function (agencyInfo) {
        agencyInfo.slug = (agencyInfo.data.abbr || '').toLowerCase();
        agencyInfo.data.domain = agencyInfo.data.domain;
        var template = _.template(AdminAgenciesTemplate)({
          agency: agencyInfo,
          agencies: this.options.agencies,
        });
        this.$el.html(template);
        if(this.options.agencies) {
          setTimeout(function () {
            $('#agencies').select2({
              allowClear: false,
            });
          }, 50);
        }
      }.bind(this),
    });

    Backbone.history.navigate('/admin/agencies/' + this.agencyId, { replace: replace });
    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.agency.id);
  },

  changeAgency: function (event) {
    Backbone.history.navigate('/admin/agencies/' + $('#agencies').val(), { trigger: true });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAgenciesView;
