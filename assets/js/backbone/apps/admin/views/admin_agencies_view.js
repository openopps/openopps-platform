var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var AdminAgenciesTemplate = require('../templates/admin_agencies_template.html');

var AdminAgenciesView = Backbone.View.extend({

  events: {
    'click .link' : 'link',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.agencyId = options.agencyId || window.cache.currentUser.agency.id;
  },

  render: function (replace) {
    var self = this;

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
        });
        self.$el.html(template);
      },
    });

    Backbone.history.navigate('/admin/agencies/' + this.agencyId, { replace: replace });
    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.agency.id);
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAgenciesView;
