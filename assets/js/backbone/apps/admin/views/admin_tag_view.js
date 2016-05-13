
var _ = require('underscore');
var Backbone = require('backbone');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');

var TagFactory = require('../../../components/tag_factory');

// templates
var fs = require('fs');
var AdminTagTemplate = fs.readFileSync(`${__dirname}/../templates/admin_tag_template.html`).toString();

var AdminTagView = Backbone.View.extend({

  events: {
  },

  initialize: function (options) {
    this.options = options;
    this.tagFactory = new TagFactory();
  },

  render: function () {
    var types = [
      'agency',
      'skill',
      'topic'
    ];
    var data = {
      types: types,
      i18n: i18n
    };
    var template = _.template(AdminTagTemplate)(data);
    var self = this;
    this.$el.html(template);
    this.$el.show();

    _(types).forEach(this.tagSelector, this);

    Backbone.history.navigate('/admin/tag');
    return this;
  },

  tagSelector: function(type) {
    var self = this;

    var $sel = this.tagFactory.createTagDropDown({
      type: type,
      selector: "#" + type,
    });

    $sel.on('change', function(e) {
      var $el = self.$(e.currentTarget);
      self.tagFactory.addTagEntities(e.added, self, function() {
        $sel.select2('data', null);
        if (e.added && e.added.value === e.added.id) {
          $el.next('.form-status').text('Added tag: ' + e.added.value);
        } else {
          $el.next('.form-status').text('');
        }
      });
    });

  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = AdminTagView;
