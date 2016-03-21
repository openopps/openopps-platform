
var _ = require('underscore');
var marked = require('marked');
var BaseComponent = require('../base/base_component');
var Template = require('./show_markdown.html');

module.exports = BaseComponent.extend({

  events: {
    'click #show-default-description' : 'clickLink'
  },

  initialize: function (options) {
    this.options = options;
    return this;
  },

  render: function () {
    var self = this;
    var data = {
      id   : self.options.id,
      data : self.options.data
    };
    var template = _.template(Template)(data);
    self.$el.html(template);
    return self;
  },

  showHide: function (descr) {
    var self = this;
    if (self.options.data.length > 0 &&  descr === 'Full Time Detail') {
      self.$('#' + self.options.id).text('Show Default Description');
      self.$('#show-default-description').show();
      self.setTextAreaText(self.options.data);
    } else {
      self.$('#show-default-description').hide();
      self.$('.preview-description').hide();
    }
    return self;
  },

  setTextAreaText: function (text) {
    var self = this;
    var currentText = $('textarea#' + self.options.textAreaId).val().trim();
    if (currentText.length === 0 && text) {
      $('#' + self.options.textAreaId).val(text);
      validate({ currentTarget: '#' + self.options.textAreaId });
    }
    return self;
  },

  clickLink: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();

    if (self.$('.preview-description').is(':visible')) {
      self.$('.preview-description').hide();
      self.$('#' + self.options.id).text('Show Default Description');
    } else {
      // Render the preview using marked.
      marked.setOptions({
        gfm    : true,
        breaks : true
      });
      var html = marked(self.options.data);
      self.$('.preview-description').html(html);
      self.$('#' + self.options.id).text('Hide Default Description');
      self.$('.preview-description').show();
    }
  },

  cleanup: function () {
    removeView(this);
  }

});
