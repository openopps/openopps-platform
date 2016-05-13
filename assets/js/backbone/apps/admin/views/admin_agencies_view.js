var _ = require('underscore');
var Backbone = require('backbone');

// templates
var fs = require('fs');
var AdminAgenciesTemplate = fs.readFileSync(`${__dirname}/../templates/admin_agencies_template.html`).toString();

var AdminAgenciesView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      agency: _(window.cache.currentUser.tags).findWhere({ type: 'agency' })
    };
  },

  render: function () {
    var self = this;

    this.$el.show();

    $.ajax({
      url: '/api/admin/agency/' + this.data.agency.id,
      dataType: 'json',
      success: function (data) {
        var template = _.template(AdminAgenciesTemplate, {
          variable: 'data'
        })(data);
        self.$el.html(template);
      }
    });

    Backbone.history.navigate('/admin/agencies/' + this.data.agency.id);
    return this;
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminAgenciesView;
