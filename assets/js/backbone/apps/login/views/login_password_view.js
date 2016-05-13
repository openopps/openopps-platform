var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');

var LoginPasswordTemplate = fs.readFileSync(
  __dirname + '/../templates/login_password_template.html'
).toString();


var LoginPasswordView = Backbone.View.extend({
  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var template = _.template(LoginPasswordTemplate);
    this.$el.html(template);
    return this;
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = LoginPasswordView;
