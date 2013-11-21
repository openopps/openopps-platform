define([
  'jquery',
  'underscore',
  'backbone',
  'popovers',
  'comment_collection',
  'comment_list_view',
  'comment_form_view',
  'comment_item_view'
], function ($, _, Backbone, Popovers, CommentCollection, CommentListView, CommentFormView, CommentItemView) {

  var popovers = new Popovers();

  Application.Controller.Comment = Backbone.View.extend({

    el: ".comment-list-wrapper",

    events: {
      "click .new-topic"                  : "newTopic",
      "click [data-topic='true']"         : "toggleTopic",
      "mouseenter .comment-user-link"     : popovers.popoverPeopleOn,
      "click .comment-user-link"          : popovers.popoverClick,
      "click a[href='#reply-to-comment']" : "reply"
    },

    initialize: function (options) {
      var self = this;
      this.options = options;

      this.initializeCommentCollection();
      this.initializeListeners();

      // Populating the DOM after a comment was created.
      this.listenTo(this.commentCollection, "comment:save:success", function (model, modelJson, currentTarget) {
        self.addNewCommentToDom(modelJson, currentTarget);
      });

    },

    initializeCommentCollection: function () {
      var self = this;

      if (this.commentCollection) { this.renderView() }
      else { this.commentCollection = new CommentCollection(); }

      if (this.options.task) {
        this.commentCollection.fetch({
          url: '/api/comment/findAllByTaskId/' + this.options.taskId,
          success: function (collection) {
            self.collection = collection;
            self.renderView(collection);
          }
        });
      } else {
        this.commentCollection.fetch({
          url: '/api/comment/findAllByProjectId/' + this.options.projectId,
          success: function (collection) {
            self.collection = collection;
            self.renderView(collection);
          }
        });
      }
    },

    initializeListeners: function() {
      var self = this;

      this.listenTo(this.commentCollection, "comment:topic:new", function (value) {
        var data = {
          projectId: self.options.projectId,
          value: value,
          topic: true
        };

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
            url: '/api/comment/findAllByProjectId/' + self.options.projectId,
            success: function (collection) {

                // var comment = new CommentItemView({
                //   el: ".comment-item",
                //   model: comment
                // }).render()

              // self.commentListView = new CommentListView({
              //   el: ".comment-list-wrapper",
              //   collection: collection
              // }).render();
            }
          });
        });
      });
    },

    renderView: function (collection) {
      var self = this;

      var data = {
        comments: collection.toJSON()[0].comments
      };

      var depth = {};
      for (var i = 0; i < data.comments.length; i += 1) {
        if (data.comments[i].topic === true) {
          depth[data.comments[i].id] = 0;
          data.comments[i]['depth'] = depth[data.comments[i].id];
        } else {
          depth[data.comments[i].id] = depth[data.comments[i].parentId] + 1;
          data.comments[i]['depth'] = depth[data.comments[i].id];
        }
      }

      self.commentViews = [];
      self.commentForms = [];
      _.each(data.comments, function (comment, i) {
        self.renderComment(self, comment, collection);
      });

      this.initializeCommentUIAdditions();
    },

    renderComment: function (self, comment, collection) {
      var self = this;
      // Render the topic view and then in that view spew out all of its children.
      // console.log("Comment's with children:");
      var commentIV = new CommentItemView({
        el: "#comment-list-" + (comment.topic ? 'null' : comment.parentId),
        model: comment,
        projectId: comment.projectId,
        collection: collection
      }).render();
      self.commentViews.push(commentIV);
      if (comment.depth <= 1) {
        // Place the commentForm at the bottom of the list of comments for that topic.
        var commentFV = new CommentFormView({
          el: '#comment-form-' + comment.id,
          projectId: comment.projectId,
          taskId: comment.taskId,
          parentId: comment.id,
          collection: collection,
          depth: comment['depth']
        });
        self.commentForms.push(commentFV);
      }
    },

    initializeCommentUIAdditions: function () {
      popovers.popoverPeopleInit(".comment-user-link");
      popovers.popoverPeopleInit(".project-people-div");
    },

    toggleTopic: function (e) {
      if (e.preventDefault) e.preventDefault();
      // The next() is the adjacent DOM element, and that will always be
      // the list of comments that directly follows the topic (not child-literal of topic though).
      $(e.currentTarget).next().slideToggle();
    },

    reply: function (e) {
      if (e.preventDefault) e.preventDefault();
      // The comment form is adjacent, not a child of the current target.
      // so find the li container, and then the form inside
      var target = $($($(e.currentTarget).parents('li.comment-item')[0]).children('.comment-form')[0]);
      if (target.data('clicked') == 'true') {
        target.hide();
        target.data('clicked', 'false');
      } else {
        target.show();
        target.data('clicked', 'true');
      }
    },

    newTopic: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();

      if (this.topicForm) this.topicForm.cleanup();
      this.topicForm = new CommentFormView({
        el: '.topic-form-wrapper',
        projectId: self.options.projectId,
        taskId: self.options.taskId,
        collection: self.collection,
        topic: true,
        depth: -1
      });
    },

    addNewCommentToDom: function (modelJson, currentTarget) {
      var self = this;
      modelJson['user'] = window.cache.currentUser;

      modelJson['depth'] = $(currentTarget).data('depth') + 1;
      self.renderComment(self, modelJson, self.collection);
      self.initializeCommentUIAdditions();

      // Clear out the current div
      $(currentTarget).find("div[contentEditable=true]").text("");
    },

    cleanup: function () {
      for (var i in this.commentForms.reverse()) {
        if (this.commentForms[i]) { this.commentForms[i].cleanup(); }
      }
      for (var i in this.commentViews.reverse()) {
        if (this.commentViews[i]) { this.commentViews[i].cleanup(); }
      }
      if (this.topicForm) {
        this.topicForm.cleanup();
      }
      removeView(this);
    }

  });

  return Application.Controller.Comment;
});
