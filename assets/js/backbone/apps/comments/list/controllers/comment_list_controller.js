var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var TimeAgo = require('../../../../../vendor/jquery.timeago');
var Popovers = require('../../../../mixins/popovers');
var Autolinker = require('autolinker');
var CommentCollection = require('../../../../entities/comments/comment_collection');
var CommentFormView = require('../../new/views/comment_form_view');
var CommentItemView = require('../views/comment_item_view');
var CommentWrapper = require('../templates/comment_wrapper_template.html');
var ReplyFormTemplate = require('../templates/reply_form_template.html');
var CommentItemTemplate = require('../templates/comment_item_template.html');
var marked = require('marked');
var popovers = new Popovers();

var Comment = Backbone.View.extend({
  el: '.comment-list-wrapper',

  events: {
    'click .delete-comment'             : 'deleteComment',
    'mouseenter .comment-user-link'     : popovers.popoverPeopleOn,
    'click .comment-user-link'          : popovers.popoverClick,
    'click .link-backbone'              : linkBackbone,
    "click a[href='#reply-to-comment']" : 'reply',
    'click #previous-comments'          : 'viewPreviousComments',
    'click .previous-replies'           : 'viewPreviousReplies',
    'focus #comment-input'              : 'hideReplyForm',
    'click .reply-submit'               : 'submitReply',
    'click #refresh-comments'           : 'refreshComments',
  },

  initialize: function (options) {
    var self = this;
    this.options = options;

    this.initializeRender();
    this.initializeCommentCollection();
    this.initializeNewTopic();
    this.initializeListeners();

    // Populating the DOM after a comment was created.
    this.listenTo(this.commentCollection, 'comment:save:success', function (model, modelJson, currentTarget) {
      this.$('[type="submit"]').prop('disabled', false);
      if (modelJson.topic) {
        if (this.topicForm) this.topicForm.empty();
        this.addNewCommentToDom(modelJson, currentTarget);
      } else { // cleanup the reply form
        $('.reply-form-container').remove();
        this.addNewReplyToDom(modelJson, currentTarget);
      }
    });

    this.listenTo(this.commentCollection, 'comment:save:error', function (model, response, options) {
      var error = options.xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            $('#' + item + '-update-alert').html(message).show();
          }
        }
      }
    });
  },

  initializeRender: function () {
    var template = _.template(CommentWrapper)({ 
      user: window.cache.currentUser,
      state: this.options.state,
    });
    this.$el.html(template);
  },

  initializeCommentCollection: function () {
    if (!this.commentCollection) {
      this.commentCollection = new CommentCollection();
    }

    if (window.cache.currentUser) {
      this.commentCollection.fetch({
        url: '/api/comment/' + this.options.target + '/' + this.options.id,
        success: function (collection) {
          this.collection = collection;
          this.renderView(collection);
        }.bind(this),
      });
    } else {
      this.renderView();
    }
  },

  initializeNewTopic: function () {
    var options = {
      el: '#comment-form-target',
      target: this.options.target,
      collection: this.commentCollection,
      topic: true,
      depth: -1,
      disable: (!_.contains(['draft', 'submitted'], this.options.state) && window.cache.currentUser) ? false : true,
    };
    options[this.options.target + 'Id'] = this.options.id;
    this.topicForm = new CommentFormView(options);
  },

  initializeListeners: function () {
    var self = this;

    this.listenTo(this.commentCollection, 'comment:topic:new', function (value) {
      var data = {
        value: value,
        topic: true,
      };
      data[self.options.target + 'Id'] = self.options.id;

      // TODO: DM: Fix this to add to the collection appropriately,
      // and fetch/re-render as needed.  This is a hack to get it to work
      $.ajax({
        url: '/api/comment',
        type: 'POST',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(data),
      }).done(function (result) {
        self.commentCollection.fetch({
          url: '/api/comment/' + self.options.target + '/' + self.options.id,
          success: function (collection) {
          },
        });
      });
    });
  },

  refreshComments: function (event) {
    event.preventDefault && event.preventDefault();
    for (var i in this.commentForms.reverse()) {
      if (this.commentForms[i]) { this.commentForms[i].cleanup(); }
    }
    for (var j in this.commentViews.reverse()) {
      if (this.commentViews[j]) { this.commentViews[j].cleanup(); }
    }
    $('#previous-comments').hide();
    $('.comment-item').remove();
    this.initializeCommentCollection();
  },

  renderView: function (collection) {
    var data = { comments: [] };
    this.topics = [];
    if ( typeof collection != 'undefined' ) {
      data.comments = collection.toJSON();
    }

    // compute the depth of each comment to use as metadata when rendering
    // in the process, create a map of the ids of each comment's children
    var depth = {};
    for (var i = 0; i < data.comments.length; i += 1) {
      depth[data.comments[i].id] = 0;
      //data.comments[i]['depth'] = depth[data.comments[i].id];
      data.comments[i].depth = 0;
      this.topics.push(data);
    }

    // hide the loading spinner
    this.$('.comment-spinner').hide();

    this.commentViews = [];
    this.commentForms = [];

    if (data.comments.length === 0) {
      this.$('#comment-empty').show();
    }
    _.each(data.comments, function (comment, i) {
      this.renderComment(comment, collection);
    }.bind(this));

    this.condenseComments();
    this.initializeCommentUIAdditions();
  },

  reply: function (event) {
    event.preventDefault && event.preventDefault();
    
    $('.reply-form-container').remove();
    var commentId = $(event.currentTarget).data('parentid') || $(event.currentTarget).data('commentid');
    $('#comment-id-' + commentId).parent().append(ReplyFormTemplate);
    
    if ( !this.isElementInViewport($('#reply-input')) ){
      $('html,body').animate({ scrollTop: $('#reply-input').offset().top }, 'slow');
    }

    var replyto = _.escape($(event.currentTarget).data('commentauthor'));
    var authorid = $(event.currentTarget).data('authorid');
    var authorSlug = "<a href='/profile/" + authorid + "' class='reply-to'>" + replyto + '</a>';

    $('#reply-input').html(authorSlug + '&nbsp;');
    $('#reply-input').data('commentid', commentId);
    placeCaretAtEnd($('#reply-input')[0]);
  },

  submitReply: function (event) {
    event.preventDefault && event.preventDefault();
    this.$('[type="submit"]').prop('disabled', true);

    var replyHtml = this.$('.reply-input').html();
    var replyText = this.$('.reply-input').text().trim();

    // abort if the comment is empty
    if (!replyText) {
      this.$('.comment-alert-empty').show();
      this.$('[type="submit"]').prop('disabled', false);
      return;
    }

    var reply = {
      taskId: this.options.id,
      topic: false,
      parentId: $('#reply-input').data('commentid'),
      comment: replyHtml,
    };
    this.$('.comment-alert-empty').hide();
    this.collection.trigger('comment:save', reply, event.currentTarget);
  },

  hideReplyForm: function () {
    $('.reply-form-container').remove();
  },

  isElementInViewport: function (el) {
    //from SO 123999

    if (typeof jQuery === 'function' && el instanceof jQuery) {
      el = el[0];
    }

    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
          rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
  },

  renderComment: function (comment, collection) {
    comment.canEdit = this.options.canEditTask;

    var commentIV = new CommentItemView({
      el: '#comment-list',
      model: comment,
      target: this.options.target,
      projectId: comment.projectId,
      taskId: comment.taskId,
      collection: collection,
    }).render();

    this.commentViews.push(commentIV);

    return $('#comment-list');
  },

  condenseComments: function () {
    var comments = $('#comment-list > .comment-item');
    if (comments.length > 2) {
      var previousComments = _.initial(comments, 2);
      $(previousComments).hide();
      $('#previous-comments').text('View previous comment' + (previousComments.length > 1 ? 's (' : ' (') + previousComments.length + ')');
      $('#previous-comments').show();
    } else {
      $('#previous-comments').hide();
    }
  },

  viewPreviousComments: function (event) {
    event.preventDefault && event.preventDefault();
    $('#previous-comments').hide();
    $(event.currentTarget.nextElementSibling.children).filter('.comment-item').show();
  },

  viewPreviousReplies: function (event) {
    event.preventDefault && event.preventDefault();
    $(event.currentTarget.nextElementSibling.children).show();
    $(event.currentTarget).hide();
  },

  initializeCommentUIAdditions: function ($comment) {
    if (_.isUndefined($comment)) {
      this.$('time.timeago').timeago();
    } else {
      $comment.find('time.timeago').timeago();
    }
    popovers.popoverPeopleInit('.comment-user-link');
    popovers.popoverPeopleInit('.project-people-div');
  },

  deleteComment: function (e) {
    if (e.preventDefault) e.preventDefault();
    var id = $(e.currentTarget).data('commentid') || null;

    if ( window.cache.currentUser ) {
      $.ajax({
        url: '/api/comment/' + id,
        type: 'DELETE',
      }).done( function (data){
        $(e.currentTarget).closest('li.comment-item').remove();
      });
    }
  },

  addNewCommentToDom: function (modelJson, currentTarget) {
    modelJson.user = window.cache.currentUser;
    // increment the comment counter
    if ($(currentTarget).data('depth') >= 0) {
      var itemContainer = $(currentTarget).parents('.comment-item.border-left')[0];
      var countSpan = $(itemContainer).find('.comment-count-num')[0];
      $(countSpan).html(parseInt($(countSpan).text()) + 1);
    }
    // set the depth based on the position in the tree
    modelJson.depth = $(currentTarget).data('depth') + 1;
    // update the parentMap for sorting
    this.topics.push(modelJson);
    // hide the empty placeholder, just in case it is still showing
    $('#comment-empty').hide();
    // render comment and UI addons
    var $comment = this.renderComment(modelJson, this.collection);
    this.initializeCommentUIAdditions($comment);

    // Clear out the current div
    $(currentTarget).find('div[contentEditable=true]').text('');
  },

  addNewReplyToDom: function (reply, target) {
    reply.user = window.cache.currentUser;
    reply.canEdit = this.options.canEditTask;
    reply.currentUser = window.cache.currentUser;
    reply.valueHtml = marked(Autolinker.link(reply.value), { sanitize: false });
    reply.commentId = reply.id;
    reply.depth = 1;
    var compiledTemplate = _.template(CommentItemTemplate)(reply);
    $('#comment-' + reply.parentId + '-replies > .replies-list').append(compiledTemplate);
    this.initializeCommentUIAdditions($('#comment-id-' + reply.id).parent());
  },

  cleanup: function () {
    for (var i in this.commentForms.reverse()) {
      if (this.commentForms[i]) { this.commentForms[i].cleanup(); }
    }
    for (var j in this.commentViews.reverse()) {
      if (this.commentViews[j]) { this.commentViews[j].cleanup(); }
    }
    if (this.topicForm) {
      this.topicForm.cleanup();
    }
    removeView(this);
  },

});

module.exports = Comment;
