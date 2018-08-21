// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var User = require('../../../../../utils/user');

var TagShowView = require('../../../tag/show/views/tag_show_view');

// templates
var ProfileSkillsTemplate = require('../templates/profile_skills_template.html');

var ProfileSkillsView = Backbone.View.extend({
  events: {
    'click #skills-cancel'        : 'cancel',
    'submit #form-profile-skills' : 'submitSkills',
  },
  
  initialize: function (options) {
    this.options = options;
  },
  
  render: function () {
    var template = _.template(ProfileSkillsTemplate)();
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    $('.usajobs-nav__menu').hide();

    this.initializeTags();
    
    return this;
  },

  initializeTags: function () {
    var showTags = true;
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.edit) showTags = false;
    
    // this is only used for edit view now
    // TODO: refactor / rename, either reuse or simplify
    this.tagView = new TagShowView({
      model: this.model,
      el: '.tag-wrapper',
      target: 'profile',
      targetId: 'userId',
      edit: this.edit,
      skills: this.skills,
      showTags: showTags,
    });
    this.tagView.render();
  },

  validateField: function (e) {
    return validate(e);
  },

  cancel: function (e) {
    window.history.back();
  },
  
  submitSkills: function (e) {
    e.preventDefault && e.preventDefault();
    alert('test');
  },
  
  cleanup: function () {
    if (this.ProfileSkillsView) { this.ProfileSkillsView.cleanup(); }
    removeView(this);
  },
  
});
  
module.exports = ProfileSkillsView;