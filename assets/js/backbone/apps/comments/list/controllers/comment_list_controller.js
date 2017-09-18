
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var TimeAgo = require('../../../../../vendor/jquery.timeago');
var Popovers = require('../../../../mixins/popovers');
var CommentCollection = require('../../../../entities/comments/comment_collection');
var CommentFormView = require('../../new/views/comment_form_view');
var CommentItemView = require('../views/comment_item_view');

var fs = require('fs');
var CommentWrapper = fs.readFileSync(`${__dirname}/../templates/comment_wrapper_template.html`).toString();

var marked = require('marked');


var popovers = new Popovers();

Comment = Backbone.View.extend({

  el: ".comment-list-wrapper",

  events: {
    "click .delete-comment"             : "deleteComment",
    "mouseenter .comment-user-link"     : popovers.popoverPeopleOn,
    "click .comment-user-link"          : popovers.popoverClick,
    "click .link-backbone"              : linkBackbone,
    "click a[href='#reply-to-comment']" : "reply"
  },

  initialize: function (options) {
    var self = this;
    this.options = options;

    this.initializeRender();
    this.initializeCommentCollection();
    this.initializeNewTopic();
    this.initializeListeners();

    // Populating the DOM after a comment was created.
    this.listenTo(this.commentCollection, "comment:save:success", function (model, modelJson, currentTarget) {
      if (modelJson.topic) {
        // cleanup the topic form
        if (this.topicForm) this.topicForm.empty();
      }
      this.$('[type="submit"]').prop("disabled", false);
      self.addNewCommentToDom(modelJson, currentTarget);
    });

  },

  initializeRender: function() {
    var template = _.template(CommentWrapper)({ user: window.cache.currentUser });
    this.$el.html(template);
  },

  initializeCommentCollection: function () {
    var self = this;

    if (this.commentCollection && !self.options.recentlyDeleted ) {
      this.renderView();
    } else {
      this.commentCollection = new CommentCollection();
      self.options.recentlyDeleted = false;
    }

    this.commentCollection.fetch({
      url: '/api/comment/findAllBy' + this.options.target + 'Id/' + this.options.id,
      success: function (collection) {
        self.collection = collection;
        self.renderView(collection);
      }
    });
  },

  initializeNewTopic: function () {
    var options = {
      el: '#comment-form-target',
      target: this.options.target,
      collection: this.commentCollection,
      topic: true,
      depth: -1,
      disable: ( window.cache.currentUser ) ? false : true
    };
    options[this.options.target + 'Id'] = this.options.id;
    this.topicForm = new CommentFormView(options);
  },

  initializeListeners: function() {
    var self = this;

    this.listenTo(this.commentCollection, "comment:topic:new", function (value) {
      var data = {
        value: value,
        topic: true
      };
      data[self.options.target + 'Id'] = self.options.id;

      // TODO: DM: Fix this to add to the collection appropriately,
      // and fetch/re-render as needed.  This is a hack to get it to work
      $.ajax({
        url: '/api/comment',
        type: 'POST',
        contentType: 'application/json',
        processData: false,
        data: JSON.stringify(data)
      }).done(function (result) {
        self.commentCollection.fetch({
          url: '/api/comment/findAllBy' + self.options.target + 'Id/' + self.options.id,
          success: function (collection) {
          }
        });
      });
    });
  },

  renderView: function (collection) {
    var data;
    var self = this;
    this.parentMap = {};
    this.topics = [];
    if ( typeof collection != 'undefined' ) {
      data = {
        comments: collection.toJSON()[0].comments
      };
    } else {
      data = {};
    }

    // compute the depth of each comment to use as metadata when rendering
    // in the process, create a map of the ids of each comment's children
    var depth = {};
    if (!data.comments) {
      data.comments = [];
    }
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
      self.renderComment(self, comment, collection, self.parentMap);
    });

    this.initializeCommentUIAdditions();
  },

  reply: function (e) {
      if (e.preventDefault) e.preventDefault();

      var inputTarget = $(".comment-input");
      if ( !this.isElementInViewport(inputTarget) ){
        $('html,body').animate({scrollTop: inputTarget.offset().top},'slow');
      }

      var replyto = _.escape($(e.currentTarget).data("commentauthor"));
      var authorid         = $(e.currentTarget).data("authorid");
      var replyToCommentId = $(e.currentTarget).data("commentid");
      var quote            = $("#comment-id-"+replyToCommentId).html();
      var authorSlug = "<a href='/profile/"+authorid+"'>"+replyto+"</a>";

      $(".comment-input").html("<i>"+authorSlug+" said</i>"+marked("> "+quote, { sanitize: false })+"&nbsp;");
   },

  isElementInViewport: function (el) {
      //from SO 123999

      if (typeof jQuery === "function" && el instanceof jQuery) {
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

  renderComment: function (unused, comment, collection, map) {
    var self = this;

    var commentIV = new CommentItemView({
      el: "#comment-list",
      model: comment,
      target: this.options.target,
      projectId: comment.projectId,
      taskId: comment.taskId,
      collection: collection
    }).render();

    self.commentViews.push(commentIV);

    return $("#comment-list");
  },

  initializeCommentUIAdditions: function ($comment) {
    if (_.isUndefined($comment)) {
      this.$("time.timeago").timeago();
    } else {
      $comment.find("time.timeago").timeago();
    }
    popovers.popoverPeopleInit(".comment-user-link");
    popovers.popoverPeopleInit(".project-people-div");
  },

  deleteComment: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var id = $(e.currentTarget).data("commentid") || null;

    if ( window.cache.currentUser && window.cache.currentUser.isAdmin ) {
      $.ajax({
        url: '/api/comment/'+id,
        type: 'DELETE'
      }).done( function(data){
        $(e.currentTarget).parent().parent().remove("li.comment-item");
        self.options.recentlyDeleted = true;
        self.initialize(self.options);
      });
    }
  },

  addNewCommentToDom: function (modelJson, currentTarget) {
    var self = this;
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
    $("#comment-empty").hide();
    // render comment and UI addons
    var $comment = self.renderComment(self, modelJson, self.collection, self.parentMap);
    self.initializeCommentUIAdditions($comment);

    // Clear out the current div
    $(currentTarget).find("div[contentEditable=true]").text("");
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
  }

});

module.exports = Comment;
