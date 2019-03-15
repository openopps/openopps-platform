var $ = require('jquery');
const _ = require('underscore');
const templates = require('./templates');


function initializeSelect2(data) {
  data.tagFactory.createTagDropDown({
    type: 'skill',
    placeholder: 'Start typing to select a skill',
    selector: '#application_skills',
    width: '100%',
    tokenSeparators: [','],
    data: data.skill,
    maximumSelectionSize: 5,
    maximumInputLength: 35,
  });
}

function getSkills () {
  var newTags = [].concat(
    $('#application_skills').select2('data'),
  ),
  data = {
    username: this.window.cache.currentUser.username,
  },
  tags = _(newTags).chain().filter(function (tag) {
    return _(tag).isObject() && !tag.context;
  }).map(function (tag) {
    return (tag.id && tag.id !== tag.name) ? +tag.id : {
      name: tag.name,
      type: tag.type,
      data: tag.data,
    };
  }).unique().value();
return newTags;
}

var skill = {
  saveSkill: function (e) {
    $('.usajobs-alert--error').hide();
    var action = $(e.currentTarget).data('action');
    $.ajax({
      url: '/api/application/' + this.data.applicationId + '/skill',
      method: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(getSkills()),
    }).done(function (result) {
      this.data.skill = result;
      this.data.language = this.data.language;
      this.$el.html(templates.applyLanguage(this.data));
      this.$el.localize();
      this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 4), selectedStep: 4 });
      window.scrollTo(0, 0);
    }.bind(this)).fail(function (err) {
      if(err.statusCode == 400) {
        showWhoopsPage();
      } else {
        $('.usajobs-alert--error').show();
        window.scrollTo(0,0);
      }
    }.bind(this));
  },

  toggleSkillOn: function (e) {
    var action = $(e.currentTarget).data('action');
    var data = {
      skill: this.data.skill,
      action: action,
      tagFactory: this.data.tagFactory,
    };

    var template = templates.applyAddSkill(data);
        
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 4), selectedStep: 4 });
    
    initializeSelect2(data);

    window.scrollTo(0, 0);
  },
    
  toggleSkillOff: function (e) {
    var data = {
      skill: this.data.skill,
      language: this.data.language,
    };
    
    var template = templates.applyLanguage(data);
    
    this.$el.html(template);
    this.$el.localize();
    this.renderProcessFlowTemplate({ currentStep: Math.max(this.data.currentStep, 4), selectedStep: 4 });
    window.scrollTo(0, 0);
  },
};

module.exports = skill;