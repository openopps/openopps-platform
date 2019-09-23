
var Bootstrap = require('bootstrap');
var _ = require('underscore');
var Backbone = require('backbone');
var async = require('async');
var ModalComponent = require('../../../../components/modal');
var TagConfig = require('../../../../config/tag');
var TagFactory = require('../../../../components/tag_factory');

var TagTemplate = require('../templates/tag_item_template.html');
var TagShowTemplate = require('../templates/tag_show_template.html');

var TagShowView = Backbone.View.extend({
  events: { },

  initialize: function (options) {
    this.options = options;
    this.model = options.model;
    this.target = options.target;
    this.targetId = options.targetId;
    this.edit = options.edit;
    this.skills = options.skills;
    this.tagFactory = new TagFactory();
    this.tags = [];

    this.showTags = (options.showTags !== false) ? true : false;

    // Figure out which tags apply
    for (var i = 0; i < TagConfig[this.target].length; i++) {
      this.tags.push(TagConfig.tags[TagConfig[this.target][i]]);
    }
  },

  render: function () {
    var data = {
      data: this.model.toJSON(),
      showTags: this.showTags,
      tags: this.tags,
      edit: this.edit,
      skills: this.skills,
      user: window.cache.currentUser || {},
    };

    if (this.model.attributes.completedBy == null) {
      data.tags = _.reject(this.tags, function (t) {
        return t.type == 'task-length';
      });
    }

    var template = _.template(TagShowTemplate)(data);
    this.$el.html(template);
    this.initializeSelect2();
    this.initializeTags();
    this.model.trigger('profile:input:changed');
    return this;
  },

  initializeSelect2: function () {
    _.each(['skill', 'topic'], function (value) {
      this.tagFactory.createTagDropDown({
        type: value,
        placeholder: 'Start typing to select a skill',
        selector:'#tag_' + value,
        width: '100%',
        tokenSeparators: [','],
        maximumInputLength: 35,
      });
    }.bind(this));

    _.each(['location', 'agency'], function (value) {
      this.tagFactory.createTagDropDown({
        type: value,
        selector:'#tag_' + value,
        width: '100%',
      });
    }.bind(this));
  },

  initializeTags: function () {
    this.tagClass = {};
    for (var i = 0; i < this.tags.length; i++) {
      this.tagClass[this.tags[i].type] = this.tags[i]['class'];
    }
    _(this.model.get('tags')).each(this.renderTag.bind(this));
    if (this.model.attributes.completedBy != null) {
      this.renderTag({
        type: 'task-length',
        name: moment(this.model.attributes.completedBy).format('ddd, MMM D, YYYY'),
      });
    }
  },

  renderTag: function (tag) {
    if(this.edit || this.skills) {
      var input = $('#tag_' + tag.type);
      var data = input.select2('data');
      data.push({id:tag.id, name:tag.name, value:tag.name});
      input.select2('data', data, true);
    } else {
      var templData = {
        data: this.model.toJSON(),
        tags: this.tags,
        tag: tag,
        edit: this.edit,
        skills: this.skills,
        user: window.cache.currentUser || {},
      };
      var compiledTemplate = _.template(TagTemplate)(templData);
      var tagDom = $('.' + tag.type).children('.tags');
      tagDom.append(compiledTemplate);
      $('#' + this.tagClass[tag.type] + '-empty').hide();
    }
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = TagShowView;
