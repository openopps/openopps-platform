
var _ = require('underscore');
var Backbone = require('backbone');

var Autolinker = require('autolinker');
var marked = require('marked');

var fs = require('fs');
var CommentItemTemplate = fs.readFileSync(`${__dirname}/../templates/comment_item_template.html`).toString();


var CommentItemView = Backbone.View.extend({

  render: function () {
    this.model.currentUser = window.cache.currentUser;
    this.model.valueHtml = marked(Autolinker.link(this.model.value), { sanitize: false });
    this.model.commentId = this.model.id;

    var compiledTemplate = _.template(CommentItemTemplate)(this.model);
    this.$el.prepend(compiledTemplate);
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = CommentItemView;
