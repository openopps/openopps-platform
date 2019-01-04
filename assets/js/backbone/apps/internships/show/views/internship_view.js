var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');

var BaseView = require('../../../../base/base_view');
var UIConfig = require('../../../../config/ui.json');
var ModalComponent = require('../../../../components/modal');

var AlertTemplate = require('../../../../components/alert_template.html');
var InternshipEditFormView = require('../../edit/views/internship_edit_form_view');
var InternshipShowTemplate = require('../templates/internship_view.html');
var ShareTemplate = require('../templates/internship_share_template.txt');
var InternshipView = BaseView.extend({
  events: {
    'click #apply'  : 'apply',
   
  },

  initialize: function (options) {
   
    this.options = options;
  },
  updateInternshipEmail: function () {
    var subject = 'Take A Look At This Opportunity',
        data = {
          opportunityTitle: this.model.get('title'),
          opportunityLink: window.location.protocol +
          '//' + window.location.host + '' + window.location.pathname,
          opportunityDescription: this.model.get('description'),
          opportunityMadlibs: $('<div />', {
            html: this.$('#task-show-madlib-description').html(),
          }).text().replace(/\s+/g, ' '),
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
  },
  organizeTags: function (tags) {
    // put the tags into their types
    return _(tags).groupBy('type');
  },
  render: function () {
    this.data = {
      user: window.cache.currentUser,
      model: this.model.toJSON(),
      madlibTags: this.organizeTags(this.model.attributes.tags),
      
    };
       
    _.each(['details', 'about'], function (part) {
      if(this.data.model[part]) {
        this.data.model[part + 'Html'] = marked(this.data.model[part]);
      }
    }.bind(this));
    
    var compiledTemplate = _.template(InternshipShowTemplate)(this.data);
    this.$el.html(compiledTemplate);
    this.$el.localize();
    $('#search-results-loading').hide();
    this.updateInternshipEmail();
    return this;
  },
  
});

module.exports = InternshipView;