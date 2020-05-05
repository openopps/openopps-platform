var _ = require('underscore');
var Backbone = require('backbone');
var Autolinker = require('autolinker');
var marked = require('marked');
var CommentItemTemplate = require('../templates/comment_item_template.html');

var CommentItemView = Backbone.View.extend({

  render: function () {
    this.model.currentUser = window.cache.currentUser;
    this.model.valueHtml = marked(Autolinker.link(this.model.value), { sanitize: false });
    this.model.commentId = this.model.id;

    var compiledTemplate = _.template(CommentItemTemplate)(this.model);
    this.$el.append(compiledTemplate);

    if (this.model.replies) {
      $('#comment-' + this.model.id + '-replies').show();
      this.renderReplies();
    }
  },

  renderReplies: function () {
    _.each(this.model.replies, function (reply) {
      reply.canEdit = this.model.canEdit;
      reply.currentUser = window.cache.currentUser;
      reply.valueHtml = marked(Autolinker.link(reply.value), { sanitize: false });
      reply.commentId = reply.id;
      reply.depth = 1;
      var compiledTemplate = _.template(CommentItemTemplate)(reply);
      $('#comment-' + this.model.id + '-replies > .replies-list').append(compiledTemplate);
      this.condenseReplies(this.model.id);
    }.bind(this));
  },

  condenseReplies: function (commentId) {
    var replies = $('#comment-' + commentId + '-replies > .replies-list > .comment-item');
    if (replies.length > 2) {
      var previousReplies = _.initial(replies, 2);
      $(previousReplies).hide();
      $('#comment-' + commentId + '-replies > .previous-replies > span').text(previousReplies.length + ' ' + (previousReplies.length == 1 ? 'reply' : 'replies'));
      $('#comment-' + commentId + '-replies > .previous-replies').show();
    } else {
      $('#comment-' + commentId + '-replies > .previous-replies').hide();
    }
    // TODO: Only show two newest replies
    // TODO: Display number of previous replies
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = CommentItemView;
