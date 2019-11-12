var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
const moment = require('moment-timezone');
var BaseView = require('../../../../base/base_view');
var UIConfig = require('../../../../config/ui.json');
var ModalComponent = require('../../../../components/modal');

var AlertTemplate = require('../../../../components/alert_template.html');
var InternshipEditFormView = require('../../edit/views/internship_edit_form_view');
var InternshipShowTemplate = require('../templates/internship_view.html');
var ApplicantsTemplate = require('../templates/applicants_view.html');
var InternsTemplate = require('../templates/interns_view.html');
var ShareTemplate = require('../templates/internship_share_template.txt');
var CopyTaskTemplate = require('../templates/copy_task_template.html').toString();
var IneligibleCitizenship = require('../../../apply/templates/apply_ineligible_citizenship_template.html');
var CloseInternshipTemplate = require('../templates/confirm_close_internship.html');

var InternshipView = BaseView.extend({
  events: {
    'click #apply'                      : 'apply',
    'click #internship-copy'            : 'copy',
    'click #internship-edit'            : linkBackbone,
    'click #save'                       : 'toggleSave',
    'click .toggle-internship-complete' : 'toggleInternComplete',
    'click #close-internship'           : 'closeInternship'
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
    this.interns = {};
    this.notCompletedInterns={};
    this.selectedInterns={};
    
  },


  modalOptions: {
    el: '#site-modal',
    id: 'closed-internship',
    modalTitle: '',
    modalBody: '',
    disableClose: false,
    secondary: { },
    primary: { },
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
    if (((this.data.model.cycle || {}).phase || {}).sequence == 3) {
      this.loadSelections();
    } else {
      this.loadApplicants();
    }
    if (window.cache.currentUser && this.params.has('action')) {
      Backbone.history.navigate(window.location.pathname, { trigger: false, replace: true });
      var action = this.params.get('action');
      this[action] && this[action](action);
    }
    $('.usa-footer-search--intern').show();
    $('.usa-footer-search--intern-hide').hide();
    return this;
  },

  save: function (action) {
    $.ajax({
      url: '/api/task/save',
      method: 'POST',
      data: {
        taskId: this.model.attributes.id, 
        action: action,
      },
    }).done(function () {
      if (action == 'save') {
        $('#save').html('<i class="fa fa-star"></i> Saved');
        $('#save')[0].setAttribute('data-action', 'unsave');
      } else {
        $('#save').html('<i class="far fa-star"></i> Save');
        $('#save')[0].setAttribute('data-action', 'save');
      }
    }).fail(function (err) {
      showWhoopsPage();
    }.bind(this));
  },

  toggleSave: function (e) {
    e.preventDefault && e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?internships/' + this.model.attributes.id + '?action=save', { trigger: true });
    } else {
      this.save(e.currentTarget.getAttribute('data-action'));
    }
  },

  displayError: function (error) {
    var modalTitle = 'You\'ve already selected 3 internships';
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
    } else if (error.responseJSON && error.responseJSON.type == 'not-eligible') {
      modalTitle = 'Only students can apply for these internships';
      primaryButton.text = 'Close';
      primaryButton.action = function () {
        this.modalComponent.cleanup();
      }.bind(this);
    }
    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'internship-apply-error',
      alert: 'error',
      primary: primaryButton,
      modalTitle: modalTitle,
      modalBody: error.responseJSON ? error.responseJSON.message : error.responseText,
    }).render();
  },

  apply: function (e) {
    e.preventDefault && e.preventDefault();
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?internships/' + this.model.attributes.id + '?action=apply', { trigger: true });
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
    var cycleData= this.model.attributes.cycle;
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
        'your application and click <strong>Submit application</strong>. You must submit changes before '+ moment.tz(cycleData.applyEndDate, 'America/New_York').format('MMMM DD, YYYY') +' at 11:59 p.m. EST.</li></ol>',
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
        return '1st';
      case '2':
        return '2nd';
      case '3':
        return '3rd';
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
          $('#internship-applicants').get(0).scrollIntoView();
        }
      }.bind(this)).fail();
    }
  },

  loadSelections: function () {
    if(window.cache.currentUser && this.model.attributes.canEditTask && window.cache.currentUser.hiringPath != 'student') {
      $.ajax({
        url: '/api/task/selections/' + this.model.attributes.id,
        method: 'GET',
      }).done(function (results) {    
        this.interns= results;
        $('#internship-interns').show();
        this.selectedInterns = results;
        this.renderSelectedInterns();       
      }.bind(this)).fail();
    }
  },

  renderSelectedInterns: function () {
    var selectedInternsTemplate = _.template(InternsTemplate)({
      interns: this.selectedInterns,
      data: this.model.attributes,     
    });
    $('#internship-interns').html(selectedInternsTemplate);
  }, 

  closeInternship: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation(); 
    this.notCompletedInterns= _.filter(this.interns,function (result){   
      return result.internshipComplete==false;
    });
    var data= {
      interns:this.notCompletedInterns,
    };   
    this.modalComponent = new ModalComponent({
      id: 'confirm-close',
      modalTitle: 'Are you sure you want to close this internship?',  
      modalBody:_.template(CloseInternshipTemplate)(data),
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Close',
        action: function () {
          this.modalComponent.cleanup();  
          this.markComplete();      
        }.bind(this),
      },
    }).render(); 
  },

  // url: '/api/task/state/' +  this.model.attributes.id,
  markComplete: function () {
    var state = 'completed';
    $.ajax({
      url: '/api/task/internship/complete/' +  this.model.attributes.id,
      type: 'PUT',
      data: {
        id: this.model.attributes.id,
        // state: state,      
      },
      success: function (data) {      
        this.model.attributes.state = 'completed';  
        this.data.model.state = 'completed';    
        this.model.attributes.completedAt = new Date(); 
        this.data.model.completedAt = new Date();
        var options = _.extend(_.clone(this.modalOptions), {
          modalTitle: 'Internship closed',
          modalBody: 'You\'ve successfully closed <strong>' + this.model.attributes.title +
            '</strong>.',
          primary: {
            text: 'Done',
            action: function () {
              this.modalComponent.cleanup();
            }.bind(this),
          },
        });
        this.modalComponent = new ModalComponent(options).render();
        this.renderSelectedInterns();              
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
  },

  toggleInternComplete: function (event) {
    var complete = $(event.currentTarget).data('behavior') == 'complete';
    var applicationId = $(event.currentTarget).data('applicationid');
    $.ajax({
      url: '/api/application/complete',
      type: 'POST',
      data: {
        taskId: this.model.attributes.id,
        applicationId: applicationId,
        complete: complete,
      },
      success: function () {
        _.find(this.selectedInterns, function (intern) {
          return intern.applicationId == applicationId;
        }).internshipComplete = complete;
        this.renderSelectedInterns();  
      }.bind(this),
      error: function () {
        showWhoopsPage();
      },
    });
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