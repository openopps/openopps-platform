var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

// templates
var fs = require('fs');
var AdminAgenciesTemplate = fs.readFileSync(`${__dirname}/../templates/admin_agencies_template.html`).toString();

var AdminAgenciesView = Backbone.View.extend({

  events: {
    'click .link'             : 'link'
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.data = {
      agency: window.cache.currentUser.agency
    };
  },

  render: function () {
    var self = this;

    this.$el.show();

    // get meta data for agency
    $.ajax({
      url: '/api/admin/agency/' + this.data.agency.id,
      dataType: 'json',
      success: function (agencyInfo) {
        agencyInfo.slug = agencyInfo.data.abbr.toLowerCase();
        agencyInfo.data.domain = agencyInfo.data.domain[0];
        var template = _.template(AdminAgenciesTemplate, {
          variable: 'agency'
        })(agencyInfo);
        self.$el.html(template);
      }
    });

    Backbone.history.navigate('/admin/agencies/' + this.data.agency.slug);
    return this;
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.agency.slug);
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminAgenciesView;
