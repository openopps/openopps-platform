var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Login = require('../../../config/login.json');

var FooterTemplate = fs.readFileSync(
  __dirname + '/../templates/footer_template.html'
).toString();


var FooterView = Backbone.View.extend({
  events: {},

  render: function() {
    var self = this;
    var data = {
      version: version,
      login: Login
    };
    var compiledTemplate = _.template(FooterTemplate)(data);
    this.$el.html(compiledTemplate);
  },

  cleanup: function() {
    removeView(this);
  }
});

module.exports = FooterView;
