// This is the comment, and topic form.
// We know what to do based on a flag being passed into this view
// via the controller.  That flag is:
// this.options.topic = true


var _ = require('underscore');
var Backbone = require('backbone');
var jqCaret = require('jquery.caret/dist/jquery.caret.min');
var jqAt = require('jquery.atwho/dist/js/jquery.atwho');
var utils = require('../../../../mixins/utilities');
var marked = require('marked');
var CommentCollection = require('../../../../entities/comments/comment_collection');
var CommentFormTemplate = require('../templates/comment_form_template.html');
var CommentAcTemplate = require('../templates/comment_ac_template.html');
var CommentInlineTemplate = require('../templates/comment_inline_template.html');


var CommentFormView = Backbone.View.extend({

  events: {
    "submit .comment-submit": "post",
    "keypress .comment-input": "submitOnEnter"
  },

  initialize: function (options) {
    this.options = options;
    this.render();
  },

  render: function () {
    var self = this;
    var data = { form: this.options };
    var template = _.template(CommentFormTemplate)(data);

    if (this.options.topic) {
      this.$el.prepend(template).append("<div class='clearfix'></div>");
    } else {
      this.$el.append(template);
    }

    var genTemplate = function (template, data) {
      if (!data) {
        return '';
      }
      // use the agency/office name as the description
      // if none exists, use the job title.
      // otherwise leave blank.
      if (data.target == 'user') {
        if (data.agency) {
          data.description = data.agency;
        }
        else if (data.title) {
          data.description = data.title;
        }
        else {
          data.description = '';
        }
      }
      // convert descriptions to markdown/html
      if (data.target == 'project') {
        if (data.description) {
          data.description = marked(data.description);
        }
        if (!data.coverId) {
          data.coverId = null;
        }
      }
      if (!data.image) {
        data.image = null;
      }
      // render template
      return _.template(template)(data);
    };

    this.$(".comment-input").atwho({
      at: '@',
      search_key: 'value',
      tpl: CommentAcTemplate,
      insert_tpl: CommentInlineTemplate,
      limit: 10,
      callbacks: {
        tpl_eval: genTemplate,
        sorter: function (query, items, search_key) {
          // don't sort, use the order from the server
          return items;
        },
        highlighter: function (li, query) {
          return li;
        },
        // highlighter: function (li, query) {
        //   var regexp;
        //   if (!query) {
        //     return li;
        //   }
        //   // just want to find all case insensitive matches and replace with <strong>
        //   // set up the query as a regular expression
        //   var re = new RegExp('(' + query.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1") + ')', 'ig');
        //   // parse the li string into a DOM node
        //   var liDom = $.parseHTML(li);
        //   var text = $(liDom[0]).text().replace(re, "<strong>$1</strong>");
        //   $(liDom[0]).html(text);
        //   return liDom[0];
        // },
        remote_filter: function (query, callback) {
          // get data from the server
          $.getJSON("/api/ac/inline", { q: query }, function (data) {
            _.each(data, function (d) {
              // At.js expects the name to be set for the matcher fn
              if (_.isUndefined(d.name)) {
                d.name = d.value;
              }
            });
            callback(data);
          });
        }
      }
    }).on("inserted.atwho", function(event, $li) {
      // This is a hack to hide the space after inserting an element.
      var ids = self.$("span.atwho-view-flag > span:visible");
      // insert a non-breaking space after the inserted element, but not within it
      // this allows the user to delete that space if they want to, without deleting
      // the referenced element
      ids.parent().after('&nbsp;');
      ids.hide();
    });

    return this;
  },

  post: function (e) {
    if (e.preventDefault) e.preventDefault();

    var commentHtml = this.$(".comment-input").html();
    var commentText = this.$(".comment-input").text().trim();

    // abort if the comment is empty
    if (!commentText) {
      this.$('.comment-alert-empty').show();
      return;
    }

    var parentId;

    if (this.options.parentId) {
      parentId = parseInt(this.options.parentId);
    }

    var data = {
      comment   : commentHtml,
      topic     : false
    };
    data[this.options.target + 'Id'] = this.options[this.options.target + 'Id'];

    if (this.options.topic) {
      data.topic = true;
    } else {
      data.parentId = parentId;
    }
    this.$('.comment-alert-empty').hide();

    var currentTarget = e.currentTarget;
    this.collection.trigger("comment:save", data, currentTarget);
  },

  submitOnEnter: function (e) {
    var enterKey = 13;
    var shiftPressed = e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey;
    if (e.which == enterKey && shiftPressed) {
      this.post(e);
    }
  },

  empty: function () {
    this.$(".comment-input").empty();
  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = CommentFormView;
