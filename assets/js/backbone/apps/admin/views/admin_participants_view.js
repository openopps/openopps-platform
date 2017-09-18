
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

// templates
var fs = require('fs');
var AdminParticipantsTemplate = fs.readFileSync(`${__dirname}/../templates/admin_participants_template.html`).toString();


var AdminParticipantsView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1
    };
  },

  render: function () {
    var self = this;

    this.$el.show();

    $.ajax({
      url: '/api/admin/participants',
      data: this.data,
      dataType: 'json',
      success: function (data) {
        data = { participantList: data};
        var template = _.template(AdminParticipantsTemplate)(data);
        self.$el.html(template);
        $('.tip').tooltip();
      }
    });

    Backbone.history.navigate('/admin/participants');
    return this;
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminParticipantsView;
