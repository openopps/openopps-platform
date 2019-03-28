// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var User = require('../../../../../utils/user');

var TagShowView = require('../../../tag/show/views/tag_show_view');
var TagFactory = require('../../../../components/tag_factory');
var Login = require('../../../../config/login.json');
var UIConfig = require('../../../../config/ui.json');

// templates
var ProfileSkillsTemplate = require('../templates/profile_skills_template.html');

var ProfileSkillsView = Backbone.View.extend({
  events: {
    'click #skills-cancel'        : 'cancel',
    'submit #form-profile-skills' : 'submitSkills',
  },
  
  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];

    if (this.data.saved) {
      this.saved = true;
      this.data.saved = false;
    }
  },

  initializeForm: function () {
    this.listenTo(this.model, 'skills:save:success', function (data) {
      this.data.saved = true;
      Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
    }.bind(this));
    
    this.listenTo(this.model, 'skills:save:fail', function (data) {
      $('#skills-save').button('fail');
    }.bind(this));
  },
  
  initializeTags: function () {
    if (this.tagView) { this.tagView.cleanup(); }
    
    // this is only used for edit view now
    // TODO: refactor / rename, either reuse or simplify
    this.tagView = new TagShowView({
      model: this.model,
      el: '.tag-wrapper',
      target: 'profile',
      targetId: 'userId',
      edit: true,
      showTags: false,
    });
    this.tagView.render();
  },

  render: function () {
    var data = {
      login: Login,
      data: this.model.toJSON(),
      tags: this.getTags(['skill', 'topic']),
      skillsTags: this.getTags(['skill']),
      interestsTags: this.getTags(['topic']),
      tagTypes: this.tagTypes,
      user: window.cache.currentUser || {},
      edit: true,
      skills: false,
      saved: this.saved,
      ui: UIConfig,
    };

    var template = _.template(ProfileSkillsTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    this.initializeForm();
    this.initializeTags();
    return this;
  },

  getTags: function (types) {
    var allTags = this.model.attributes.tags;
    var result = _.filter(allTags, function (tag) {
      return _.contains(types, tag.type);
    });
    return result;
  },

  cancel: function (e) {
    e.preventDefault();
    Backbone.history.navigate('profile/' + this.model.toJSON().id, { trigger: true });
  },
  
  submitSkills: function (e) {
    e.preventDefault && e.preventDefault();

    var newTags = [].concat(
          $('#tag_topic').select2('data'),
          $('#tag_skill').select2('data'),
        ),
        data = {
          username: this.model.attributes.username,
        },
        tags = _(newTags).chain().filter(function (tag) {
          return _(tag).isObject() && !tag.context;
        }).map(function (tag) {
          return (tag.id && tag.id !== tag.name) ? +tag.id : {
            name: tag.name,
            type: tag.tagType,
            data: tag.data,
          };
        }).unique().value();
    data.tags = tags;
    this.model.trigger('skills:save', data);
  },
  
  cleanup: function () {
    if (this.ProfileSkillsView) { this.ProfileSkillsView.cleanup(); }
    removeView(this);
  },
});
  
module.exports = ProfileSkillsView;