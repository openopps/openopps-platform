/**
 * This component implements a Markdown TextEditor that can be
 * dropped into anywhere on an existing form.
 * Initialize the MarkdownEditor with an element `el`,
 * and the `id` of the textarea (so you can retreive its
 * value when the user submits the form.)
 *
 * Options:
 *   el: HTML element to fill - required
 *   id: HTML ID for the <textarea> element - required
 *   data: Default data for the textarea - required
 *   placeholder: Textarea placeholder value - optional
 *   maxlength: Maximum characters for the text area - optional
 *   rows: Number of rows in the textarea - optional
 *   validate: List of strings for the data-validate attribute - optional
 *     example: ['empty', 'count400']
 */

var fs = require('fs');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var BaseComponent = require('../base/base_component');
var EditorTemplate = fs.readFileSync(
  __dirname + '/markdown_editor_template.html'
).toString();



var MarkdownEditor = BaseComponent.extend({
  events: {
    "click .btn": "clickButton"
  },

  initialize: function(options) {
    this.options = options;
    this.actions = {
      'header': {
        before: '## ',
        text: 'Heading',
        after: '\n',
      },
      'bold': {
        before: '**',
        text: 'text',
        after: '**'
      },
      'italic': {
        before: '_',
        text: 'text',
        after: '_'
      },
      'strikethrough': {
        before: '~~',
        text: 'text',
        after: '~~'
      },
      'code': {
        before: '`',
        text: 'code',
        after: '`'
      },
      'link': {
        before: '[Link Title](',
        text: 'http://',
        after: ')'
      },
      'list-ul': {
        before: '- ',
        text: 'List item X',
        after: '\n- List item Y\n- List item Z\n',
      },
      'list-ol': {
        before: '1. ',
        text: 'Numbered List item 1',
        after: '\n1. Numbered List item 2\n1. Numbered List item 3\n',
      },
    };
    return this;
  },

  render: function() {
    var data = {
      id: this.options.id,
      validate: this.options.validate,
      rows: this.options.rows,
      maxlength: this.options.maxlength,
      placeholder: this.options.placeholder,
      title: this.options.title,
      data: this.options.data
    };
    var template = _.template(EditorTemplate)(data);
    this.$el.html(template);
    return this;
  },

  clickButton: function(e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var selText = this.$("#" + this.options.id).selection();
    var editData = t.data('edit');
    if ((editData != 'preview') &&
      (editData != 'edit') &&
      (editData != 'help')) {
      // get the current selected positions
      var pos = this.$("#" + this.options.id).selection('getPos');
      var text = this.$("#" + this.options.id).val();
      // check if this modifier has already been inserted
      var origBefore = text.substring(pos.start - this.actions[editData].before.length, pos.start);
      var origAfter = text.substring(pos.end, pos.end + this.actions[editData].after.length);
      var before = this.actions[editData].before;
      var after = this.actions[editData].after;
      // If the selected text already has the markdown syntax before and after
      // don't insert it again.  Eg, if text is selected in **text**, don't add ** again
      if ((origBefore == before) && (origAfter == after)) {
        before = '';
        after = '';
      }
      // set placeholder text if no text is selected by the user
      if (selText === '') {
        selText = this.actions[editData].text;
      }
      // insert markdown syntax
      this.$("#" + this.options.id).selection('insert', {
          text: before,
          mode: 'before'
        })
        .selection('replace', {
          text: selText
        })
        .selection('insert', {
          text: after,
          mode: 'after'
        });
    } else if (editData == 'help') {
      // show help text and links to markdown syntax
      if (this.$('.help').is(':visible')) {
        this.$('.help').hide();
        t.removeClass('active');
      } else {
        this.$('.help').show();
        t.addClass('active');
      }
    } else {
      if (this.$('.preview').is(':visible')) {
        // if we're in preview mode, switch back to edit mode
        this.$('.btn-edit').hide();
        this.$('.btn-preview').show();
        this.$('.preview').hide();
        this.$("#" + this.options.id).show();
      } else {
        // render the preview using marked
        var html = marked(this.$("#" + this.options.id).val());
        this.$('.btn-preview').hide();
        this.$('.btn-edit').show();
        this.$('.preview').html(html);
        this.$("#" + this.options.id).hide();
        this.$('.preview').show();
      }
    }
  },

  cleanup: function() {
    removeView(this);
  }
});


module.exports = MarkdownEditor;
