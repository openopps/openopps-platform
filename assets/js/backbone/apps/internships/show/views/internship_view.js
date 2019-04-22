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
var ApplicantsTemplate = require('../templates/applicants_view.html');
var ShareTemplate = require('../templates/internship_share_template.txt');
var CopyTaskTemplate = require('../templates/copy_task_template.html').toString();
var IneligibleCitizenship = require('../../../apply/templates/apply_ineligible_citizenship_template.html');

var InternshipView = BaseView.extend({
  events: {
    'click #apply'      : 'apply',
    'click #task-copy'  : 'copy',
    'click #save'       : 'toggleSave',
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
  },

  render: function () {
    this.data = {
      user: window.cache.currentUser,
      model: this.model.toJSON(),
      madlibTags: this.organizeTags(this.model.attributes.tags),
      fromSearch: this.params.has('fromSearch'),
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
    this.loadApplicants();
    if (window.location.hash == '#apply') {
      Backbone.history.navigate(window.location.pathname, { trigger: false, replace: true });
      this.apply({});
    }
    $('.usa-footer-search--intern').show();
    $('.usa-footer-search--intern-hide').hide();
    return this;
  },

  toggleSave: function (e) {
    e.preventDefault && e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?internships/' + this.model.attributes.id, { trigger: true });
    } else {
      $.ajax({
        url: '/api/task/save',
        method: 'POST',
        data: {
          taskId: this.model.attributes.id, 
          action: e.currentTarget.getAttribute('data-action'),
        },
      }).done(function () {
        if (e.currentTarget.getAttribute('data-action') == 'save') {
          $('#save').html('<i class="fa fa-star"></i> Saved');
          e.currentTarget.setAttribute('data-action', 'unsave');
        } else {
          $('#save').html('<i class="far fa-star"></i> Save');
          e.currentTarget.setAttribute('data-action', 'save');
        }
      }).fail(function (err) {

      }.bind(this));
    }
  },

  displayError: function (error) {
    var primaryButton = {
      text: 'Close',
      action: function () {
        this.modalComponent.cleanup();
      }.bind(this),
    };
    if (error.responseJSON && error.responseJSON.type == 'maximum-reached') {
      primaryButton.text = 'Update application';
      primaryButton.action = function () {
        this.modalComponent.cleanup();
        Backbone.history.navigate('/apply/' + error.responseJSON.applicationId + '?step=1', { trigger: true });
      }.bind(this);
    }
    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'internship-apply-error',
      alert: 'error',
      primary: primaryButton,
      modalTitle: 'You\'ve already selected 3 internships',
      modalBody: error.responseJSON ? error.responseJSON.message : error.responseText,
    }).render();
  },

  apply: function (e) {
    e.preventDefault && e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?internships/' + this.model.attributes.id + '#apply', { trigger: true });
    } else if (window.cache.currentUser.isUsCitizen) {
      if(this.model.attributes.application){
        this.updateApplication();
      }
      else{
        $.ajax({
          url: '/api/application/apply/' + this.model.attributes.id,
          method: 'POST',
        }).done(function (applicationId) {
          Backbone.history.navigate('/apply/' + applicationId, { trigger: true });
        }).fail(this.displayError.bind(this));
      }
    } else {
      Backbone.history.navigate('/ineligible_citizenship', { trigger: true, replace: true });
      window.scrollTo(0, 0);
    }
  },

  updateApplication: function () {
    if (this.modalComponent) { this.modalComponent.cleanup(); }  
    var applicationData=this.model.attributes.application;  
    if (applicationData.submitted_at == null) {
      Backbone.history.navigate('apply/' + applicationData.application_id, { trigger: true });
    } else {
      this.modalComponent = new ModalComponent({
        el: '#site-modal',
        id: 'submit-opp',
        modalTitle: 'Update application',
        modalBody: '<p>You are about to make edits to an application you have already submitted. Follow these steps to resubmit your application:</p> ' +
        '<ol><li>Go to the page you want to edit by using the progress bar at the top of the page or by clicking the <strong>Save and continue</strong> ' +
        'button on each page.</li><li>Click <strong>Save and continue</strong> once you make your change.</li><li>Click <strong>Save and continue</strong> ' +
        'on all of the pages following the page you edited (you don\'t have to <strong>Save and continue</strong> on any previous pages).</li><li>Review ' +
        'your application and click <strong>Submit application</strong>.</li></ol>',
        primary: {
          text: 'Update application',
          action: function () {
            Backbone.history.navigate('apply/' + applicationData.application_id + '?step=1', { trigger: true });
            this.modalComponent.cleanup();
          }.bind(this),
        },
      }).render();
    }
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
    var subject = 'Take a look at this internship opportunity',
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

  getApplicantPreference: function (preference) {
    switch (preference.toString()) {
      case '1':
        return '1st'
      case '2':
        return '2nd'
      case '3':
        return '3rd'
    }
  },

  loadApplicants: function () {
    if(window.cache.currentUser && window.cache.currentUser.hiringPath != 'student') {
      $.ajax({
        url: '/api/task/applicants/' + this.model.attributes.id,
        method: 'GET',
      }).done(function (results) {
        $('#internship-applicants').show();
        $('#internship-applicants').html(_.template(ApplicantsTemplate)({
          applicants: results,
          getApplicantPreference: this.getApplicantPreference,
        }));
        if(window.location.hash.indexOf('applicants') != -1) {
          $('#internship-applicants').get(0).scrollIntoView()
        }
      }.bind(this)).fail();
    }
  },

  cleanup: function () {
    $('.usa-footer-search--intern-hide').show();
    $('.usa-footer-search--intern').hide();
    removeView(this);
  },

  organizeTags: function (tags) {
    // put the tags into their types
    return _(tags).groupBy('type');
  },
});

module.exports = InternshipView;