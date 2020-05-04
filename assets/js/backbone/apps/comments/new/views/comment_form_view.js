// This is the comment, and topic form.
// We know what to do based on a flag being passed into this view
// via the controller.  That flag is:
// this.options.topic = true
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
//var jqCaret = require('jquery.caret/dist/jquery.caret.min');
//var jqAt = require('jquery.atwho/dist/js/jquery.atwho');

var marked = require('marked');
var CommentCollection = require('../../../../entities/comments/comment_collection');

var CommentFormTemplate = require('../templates/comment_form_template.html');
var CommentAcTemplate = require('../templates/comment_ac_template.html');
var CommentInlineTemplate = require('../templates/comment_inline_template.html');

var CommentFormView = Backbone.View.extend({

  events: {
    'submit .comment-submit'           : 'post',
    'keypress .comment-input'          : 'submitOnEnter',
    'blur .validate'                   : 'validateField',
    'keyup .validate'                  : 'validateField',
    'change .validate'                 : 'validateField',
  },

  initialize: function (options) {
    this.options = options;
    this.render();
  },

  validateField: function (e) {
    return validate(e);
  },

  render: function () {
    var self = this;
    var data = { form: this.options };
    var template = _.template(CommentFormTemplate)(data);
    if (this.options.topic) {
      this.$el.append(template).append("<div class='clearfix'></div>");
    } else {
      this.$el.append(template);
    }

    this.$('[type="submit"]').prop('disabled', false);
    this.$('.comment-alert-empty').hide();

    var genTemplate = function (template, data) {
      if (!data) {
        return '';
      }
      // use the agency/office name as the description
      // if none exists, use the job title.
      // otherwise leave blank.
      if (data.target == 'user') {
        if (data.agency) {
          data.description = _.escape(data.agency);
        }
        else if (data.title) {
          data.description = _.escape(data.title);
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

    return this;
  },

  post: function (e) {
    if (e.preventDefault) e.preventDefault();

    this.$('[type="submit"]').prop('disabled', true);

    var commentHtml = this.$('.comment-input').html();
    var commentText = this.$('.comment-input').text().trim();

    // abort if the comment is empty
    if (!commentText) {
      this.$('.comment-alert-empty').show();
      this.$('[type="submit"]').prop('disabled', false);
      return;
    }

    var parentId;

    if (this.options.parentId) {
      parentId = parseInt(this.options.parentId);
    }

    var data = {
      comment   : commentHtml,
      topic     : false,
    };
    data[this.options.target + 'Id'] = this.options[this.options.target + 'Id'];

    if (this.options.topic) {
      data.topic = true;
    } else {
      data.parentId = parentId;
    }
    
    this.$('.comment-alert-empty').hide();
    this.collection.trigger('comment:save', data, e.currentTarget);
  },

  submitOnEnter: function (e) {
    var enterKey = 13;
    var shiftPressed = e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey;
    if (e.which == enterKey && shiftPressed) {
      this.post(e);
    }
  },

  empty: function () {
    this.$('.comment-input').empty();
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = CommentFormView;
