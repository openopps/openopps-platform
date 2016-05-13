
var Bootstrap = require('bootstrap');
var _ = require('underscore');
var Backbone = require('backbone');
// var utils = require('../../../../mixins/utilities');
var async = require('async');
var ModalComponent = require('../../../../components/modal');
var TagConfig = require('../../../../config/tag');

var TagFactory = require('../../../../components/tag_factory');

var fs = require('fs');
var TagTemplate = fs.readFileSync(`${__dirname}/../templates/tag_item_template.html`).toString();
var TagShowTemplate = fs.readFileSync(`${__dirname}/../templates/tag_show_template.html`).toString();

var TagShowView = Backbone.View.extend({

  events: {
    "click .tag-delete"     : "deleteTag"
  },

  /*
    @param {Object}  options
    @param {String}  options.target   - key for looking up tag-type sets from the TagConfig (profile|task|project)
    @param {Boolean} options.edit     - whether or not to display the tag editor
  */
  initialize: function (options) {
    this.options = options;
    this.model = options.model;
    this.target = options.target;
    this.targetId = options.targetId;
    this.edit = options.edit;
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
      user: window.cache.currentUser || {}
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
    return this;
  },

  initializeSelect2: function () {
    var self = this;

    self.tagFactory.createTagDropDown({
      type:"skill",
      selector:"#tag_skill",
      width: "100%",
      tokenSeparators: [","]
    });

    self.tagFactory.createTagDropDown({
      type:"topic",
      selector:"#tag_topic",
      width: "100%",
      tokenSeparators: [","]
    });

    self.tagFactory.createTagDropDown({
      type:"location",
      selector:"#tag_location",
      width: "100%"
    });

    self.tagFactory.createTagDropDown({
      type:"agency",
      selector:"#tag_agency",
      width: "100%"
    });

    self.model.trigger("profile:input:changed");
  },

  initializeTags: function() {
    // Load tags for the view
    var self = this;

    var tagIcon = {};
    var tagClass = {};
    for (var i = 0; i < this.tags.length; i++) {
      tagIcon[this.tags[i].type] = this.tags[i].icon;
      tagClass[this.tags[i].type] = this.tags[i]['class'];
    }
    var renderTag = function (tag) {
      if(self.edit)
      {
        var input = $("#tag_" + tag.type);
        var data = input.select2('data');
        data.push({id:tag.id,name:tag.name, value:tag.name});
        input.select2("data", data, true);
      }
      else
      {
        var templData = {
          data: self.model.toJSON(),
          tags: self.tags,
          tag: tag,
          edit: self.edit,
          user: window.cache.currentUser || {}
        };
        var compiledTemplate = _.template(TagTemplate)(templData);
        var tagDom = $("." + tag.type).children(".tags");
        tagDom.append(compiledTemplate);
        $('#' + tagClass[tag.type] + '-empty').hide();
      }
    };

    _(this.model.get('tags')).each(renderTag);
    if (this.model.attributes.completedBy != null) {
      renderTag({
        type: 'task-length',
        name: moment(self.model.attributes.completedBy).format('ddd, MMM D, YYYY')
      });
    }

    this.listenTo(this.model, this.target + ":tag:delete", function (e) {
      if ($(e.currentTarget).parent('li').siblings().length == 1) {
        $(e.currentTarget).parent('li').siblings('.tag-empty').show();
      }
      $(e.currentTarget).parent('li').remove();
    });
  },

  deleteTag: function (e) {
    if (e.preventDefault) e.preventDefault();
    var tags = _(this.model.get('tags')).filter(function(tag) {
          return tag.id !== $(e.currentTarget).data('id');
        });
    this.model.set('tags', tags);
    this.model.trigger(this.options.target + ":tag:delete", e);

  },

  cleanup: function () {
    removeView(this);
  }

});

module.exports = TagShowView;
