var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var Login = require('../../../config/login.json');
var UIConfig = require('../../../config/ui.json');
var FooterTemplate = require('../templates/footer_template.html');

function versionLink (version) {
  var link;
  var parts = version.split('-');
  if (parts.length === 1) {
    link = 'https://github.com/openopps/openopps-platform/releases/tag/v' + parts[0];
  } else {
    // this is a pre-release version, like 0.10.1-beta
    // since we won't have tagged a release yet, show the issues for this milestone
    link = 'https://github.com/openopps/openopps-platform/issues?q=milestone%3A' + parts[0] + '+is%3Aclosed';
  }
  return link;
}
var FooterView = Backbone.View.extend({
  events: {},

  render: function () {
    var self = this;
    var data = {
      version: version,
      versionLink: versionLink(version),
      login: Login,
      ui: UIConfig,
    };
    var compiledTemplate = _.template(FooterTemplate)(data);
    this.$el.html(compiledTemplate);
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = FooterView;
