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
var CopyTaskTemplate = require('../templates/copy_task_template.html').toString();
var InternshipView = BaseView.extend({
  events: {
    'click #apply'  : 'apply',
    'click #task-copy': 'copy',
   
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
  },


  copy: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;

    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(CopyTaskTemplate)({ title: 'COPY ' + self.model.attributes.title});

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'check-copy',
      modalTitle: 'Copy this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Copy opportunity',
        action: function () {
          $.ajax({
            url: '/api/task/copy',
            method: 'POST',
            data: {
              taskId: self.model.attributes.id,
              title: $('#task-copy-title').val(),
            },
          }).done(function (data) {
            console.log(data);
            self.modalComponent.cleanup();
            
            Backbone.history.navigate('/internships/' + data.taskId + '/edit',{ trigger : true});
          });
        },
      },
    }).render();
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
      showBackToResults: this.params.has('fromSearch'),
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