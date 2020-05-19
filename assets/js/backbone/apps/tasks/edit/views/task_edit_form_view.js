var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var UIConfig = require('../../../../config/ui.json');
var marked = require('marked');
var MarkdownEditor = require('../../../../components/markdown_editor');
var TagFactory = require('../../../../components/tag_factory');
var ShowMarkdownMixin = require('../../../../components/show_markdown_mixin');
var TaskFormViewHelper = require('../../task-form-view-helper');
var TaskEditFormTemplate = require('../templates/task_edit_form_template.html');
var TaskPreviewTemplate = require('../templates/task_preview_template.html');
var ModalComponent = require('../../../../components/modal');
var charcounter = require('../../../../../vendor/jquery.charcounter');

var TaskEditFormView = Backbone.View.extend({

  events: {
    'blur .validate'                      : 'validateField',
    'change .validate'                    : 'validateField',
    'click #change-owner'                 : 'displayChangeOwner',
    'click #add-participant'              : 'displayAddParticipant',
    'click .usa-button'                   : 'submit',
    'click .opportunity-people'           : 'togglePeopleOptions',
    'click .time-options-time-required'   : 'toggleTimeOptions',
    'click .opportunity-location'         : 'toggleLocationOptions',
    'click .expandorama-button-skills'    : 'toggleAccordion1',
    'click .expandorama-button-team'      : 'toggleAccordion2',
    'click .expandorama-button-keywords'  : 'toggleAccordion3',
    'click .expandorama-button-requirement': 'toggleAccordion4',
    'click .expandorama-button-apply'      : 'toggleAccordion5',
    'change [name=CareerField]'           : 'toggleCareerField',
    'change [name=task-restrict-agency]'        : 'toggleAgencyRestrict',  
    'change input[name=detail-group]'      : 'changeDetailReimbursable', 
    
  

  },

  initialize: function (options) {
    _.extend(this, Backbone.Events);

    var view                    = this;
    this.options                = options;
    this.tagFactory             = new TagFactory();
    this.owner                  = this.model.get( 'owner' );
    this.agency                 = this.owner ? this.owner.agency : window.cache.currentUser.agency;
    this.agencies               = this.model.get('agencies') || this.toList(this.agency);
    this.data                   = {};
    this.data.newTag            = {};
    this.communities            =  {};
    this.payPlans               = [];
   
    TaskFormViewHelper.annotateTimeRequired(options.tagTypes['task-time-required'], this.agency);
    this.tagSources = options.tagTypes;  // align with naming in TaskFormView, so we can share completionDate 
    this.initializeListeners();

    this.listenTo(this.options.model, 'task:update:success', function (data) {
      Backbone.history.navigate('tasks/' + data.attributes.id, { trigger: true });
      if(data.attributes.state == 'submitted') {
        this.modalComponent = new ModalComponent({
          el: '#site-modal',
          id: 'submit-opp',
          modalTitle: 'Submitted',
          modalBody: 'Thanks for submitting <strong>' + data.attributes.title + '</strong>. We\'ll review it and let you know if it\'s approved or if we need more information.',
          primary: {
            text: 'Close',
            action: function () {
              this.modalComponent.cleanup();
            }.bind(this),
          },
          secondary: {
            text: 'Create another opportunity',
            action: function () {
              Backbone.history.navigate('/tasks/create?target=feds', { trigger: true });
              this.modalComponent.cleanup();
            }.bind(this),
          },
        }).render();
      }
    });
    this.listenTo(this.options.model, 'task:update:error', function (model, response, options) {
      var error = options.xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            $('#' + item + '-update-alert-message').html(message);
            $('#' + item + '-update-alert').show();
          }
        }
      } else if (error) {
        var alertText = response.statusText + '. Please try again.';
        $('.alert.alert-danger').text(alertText).show();
        $(window).animate({ scrollTop: 0 }, 500);
      }
    });
  }, 

  toList: function (agency) {
    if(agency && agency.parent) {
      return [_.pick(agency, ['agency_id', 'abbr', 'name'])].concat(this.toList(agency.parent));
    } else {
      return [_.pick(agency, ['agency_id', 'abbr', 'name'])];
    }
  },

  toggleAgencyRestrict: function (event) {
    var value = event.target.value;
    $('input[name=task-restrict-agency]').filter((index, element) => {
      return element.value != value;
    }).each((index, element) => {
      element.checked = false;
    });
  },


  /*
   * Render modal for the Task Creation Form ViewController
   */
  renderSaveSuccessModal: function () {
    var $modal = this.$( '.js-success-message' );
    $modal.slideDown( 'slow' );
    $modal.one('mouseout', function () {
      _.delay( _.bind( $modal.slideUp, $modal, 'slow' ), 4200 );
    });
  },

  validateField: function (e) {
    return validate(e);
  },
  
  isPastDate: function (completionDate)
  {   
    var todaysDate = new Date().toISOString().slice(0, 10);
    var inputCompletionDate = completionDate;
 
    if(todaysDate <= inputCompletionDate){
      return false;
    }
    else{
      return true;
    }
  },
  
  render: function () {
    this.loadAudienceCommunityData();
    this.initializePayLevel();
    
    this.data = {
      data: this.model.toJSON(),
      community: this.options.community,
      tagTypes: this.options.tagTypes,
      newTags: [],
      newItemTags: [],
      tags: this.options.tags,
      madlibTags: this.options.madlibTags,
      ui: UIConfig,
      agency: this.agency,
      agencies: this.agencies,
      communities:this.communities,   
      payPlans:this.payPlans, 
      accordion1: {
        open: false,
      },
      accordion2: {
        open: false,
      },
      accordion3: {
        open: false,
      },

      accordion4: {
        open: false,
      },
      accordion5: {
        open: false,
      },
    };

    var compiledTemplate = _.template(TaskEditFormTemplate)(this.data);
    this.$el.html(compiledTemplate);
    this.$el.localize();

    // DOM now exists, begin select2 init
    this.initializeSelect2();
    this.initializeTextAreaIntroduction();
    this.initializeTextAreaDetails();
    this.initializeTextAreaSkills();
    this.initializeTextAreaTeam();
    this.initializeTextAreaApply();
    this.initializeTextAreaRequirement();
    this.initializeCommunityDropDown();
    this.characterCount();

    if(!_.isEmpty(this.data['madlibTags'].keywords)) {
      $('#keywords').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#keywords').attr('aria-hidden', false);
    }

    this.$( '.js-success-message' ).hide();
    this.togglePeopleOptions();
    this.toggleTimeOptions();
    this.toggleLocationOptions();
    this.toggleCareerField();
    $('#search-results-loading').hide();
    return this;
  },

  loadAudienceCommunityData:function (){
    $.ajax({
      url: '/api/task/communities',  
      type: 'GET',
      async: false,
      success: function (data){ 
        this.communities= data;      
      }.bind(this),
    });
  },

  initializeSelect2: function () {
    var formatResult = function (object) {
      var formatted = '<div class="select2-result-title">';
      formatted += _.escape(object.name || object.title);
      formatted += '</div>';
      if (!_.isUndefined(object.description)) {
        formatted += '<div class="select2-result-description">' + marked(object.description) + '</div>';
      }
      return formatted;
    };

    this.tagFactory.createTagDropDown({
      type: 'series',
      placeholder: 'Start typing to select a series',
      selector: '#opportunity-series',
      allowCreate: false,
      width: '100%',
      tokenSeparators: [','],
      data: this.data['madlibTags'].series,
    });

    this.tagFactory.createTagDropDown({
      type: 'skill',
      placeholder: 'Start typing to select a skill',
      selector: '#task_tag_skills',
      width: '100%',
      tokenSeparators: [','],
      data: this.data['madlibTags'].skill,
      maximumSelectionSize: 5,
      maximumInputLength: 35,
    });

    this.tagFactory.createTagDropDown({
      type: 'location',
      selector: '#task_tag_location',
      width: '100%',
      data: this.data['madlibTags'].location,
    });

    this.tagFactory.createTagDropDown({
      type: 'keywords',
      selector: '#task_tag_keywords',
      placeholder: 'Start typing to select a keyword',
      width: '100%',
      data: this.data['madlibTags'].keywords,
      maximumSelectionSize: 5,
      maximumInputLength: 35,
    });

    $('#opportunity-career-field').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });

    $('#js-time-frequency-estimate').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });

    $('#time-estimate').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });

    $('#people').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });

    $('#time-options-pay-scale').select2({
      placeholder: '- Select -',
      width: '100%',
      allowClear: true,
    });
    

  },

  initializeTextAreaIntroduction: function () {
    if (this.md1) { this.md1.cleanup(); }
    this.md1 = new MarkdownEditor({
      data: this.model.toJSON().description,
      el: '.markdown-edit-introduction',
      id: 'opportunity-introduction',
      placeholder: '',
      title: 'Introduction',
      rows: 6,
      validate: ['empty','html','count1500'],
    }).render();
  },

  initializeTextAreaDetails: function () {
    if (this.md2) { this.md2.cleanup(); }
    this.md2= new MarkdownEditor({
      data: this.model.toJSON().details,
      el: '.markdown-edit-details',
      id: 'opportunity-details',
      placeholder: '',
      title: 'What you\'ll do',
      rows: 6,
      validate: ['empty','html','count5000'],
    }).render();
  },

  initializeTextAreaSkills: function () {
    if (this.md3) { this.md3.cleanup(); }
    this.md3 = new MarkdownEditor({
      data: this.model.toJSON().outcome,
      el: '.markdown-edit-skills',
      id: 'opportunity-skills',
      placeholder: '',
      title: 'What you\'ll learn',
      rows: 6,
      validate: ['html','count5000'],
    }).render();
    if(this.model.toJSON().outcome) {
      $('#skills').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#skills').attr('aria-hidden', false);
    }
  },

  initializeTextAreaTeam: function () {
    if (this.md4) { this.md4.cleanup(); }
    this.md4 = new MarkdownEditor({
      data: this.model.toJSON().about,
      el: '.markdown-edit-team',
      id: 'opportunity-team',
      placeholder: '',
      title: 'Who we are',
      rows: 6,
      validate: ['html','count5000'],
    }).render();
    if(this.model.toJSON().about) {
      $('#team').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#team').attr('aria-hidden', false);
    }
  },

  initializeTextAreaRequirement: function () {   
    if (this.md5) { this.md5.cleanup(); }
    this.md5 = new MarkdownEditor({
      data: this.model.toJSON().requirement,
      el: '.markdown-edit-requirement',
      id: 'opportunity-requirement',
      placeholder: '',
      title: 'Requirements',
      rows: 6,
      validate: ['html','count5000'],
    }).render();
    if(this.model.toJSON().requirement) {
      $('#requirement').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#requirement').attr('aria-hidden', false);
    }
  },
  initializeTextAreaApply: function () {
    if (this.md6) { this.md6.cleanup(); }
    this.md6 = new MarkdownEditor({
      data: this.model.toJSON().applyAdditional,
      el: '.markdown-edit-apply',
      id: 'opportunity-apply',
      placeholder: '',
      title: 'How to apply',
      rows: 6,
      validate: ['html','count5000'],
    }).render();
    if(this.model.toJSON().applyAdditional) {
      $('#apply-participant').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#apply-participant').attr('aria-hidden', false);
    }
  },

 
 


  characterCount: function () {
    $('.markdown-edit-introduction .usajobs-form__help-brief').append('  <span id="opportunity-introduction-count">(1500 characters remaining)</span>');
    $('.markdown-edit-details .usajobs-form__help-brief').append('  <span id="opportunity-details-count">(5000 characters remaining)</span>');
    $('.markdown-edit-skills .usajobs-form__help-brief').append('  <span id="opportunity-skills-count">(5000 characters remaining)</span>');
    $('.markdown-edit-team .usajobs-form__help-brief').append('  <span id="opportunity-team-count">(5000 characters remaining)</span>');
    $('.markdown-edit-apply .usajobs-form__help-brief').append('  <span id="opportunity-apply-count">(5000 characters remaining)</span>');
    $('.markdown-edit-requirement .usajobs-form__help-brief').append('  <span id="opportunity-requirement-count">(5000 characters remaining)</span>');
    $('#task-title').charCounter(100, {
      container: '#opportunity-title-count',
    });
    $('#opportunity-introduction').charCounter(1500, {
      container: '#opportunity-introduction-count',
    });
    $('#opportunity-details').charCounter(5000, {
      container: '#opportunity-details-count',
    });
    $('#opportunity-skills').charCounter(5000, {
      container: '#opportunity-skills-count',
    });
    $('#opportunity-team').charCounter(5000, {
      container: '#opportunity-team-count',
    });
    $('#opportunity-apply').charCounter(5000, {
      container: '#opportunity-apply-count',
    });
    $('#opportunity-requirement').charCounter(5000, {
      container: '#opportunity-requirement-count',
    });
  },
  
  initializeCommunityDropDown: function (){
    var communityId= this.model.toJSON().communityId;
    if(communityId){
      $('#federal-programs').val(communityId);
    }
  },
  /*
   * Initialize the `task:tags:save:done` listener for this view.
   * The event is triggered from the `submit` & `saveDraft` methods.
   */
  initializeListeners: function () {
    this.on( 'task:tags:save:done', function (event) {
      var modelData = this.getDataFromPage();
      // README: Check if draft is being saved or if this is a submission.
      // If the state isn't a draft and it isn't simply being saved, then it will
      // be submitted for review. `event.saveState` is true if the task is not a
      // `draft` and assumes that the task is simply being updated rather than
      // there being a need to "Submit for Review".
      //
      if (event.draft) {
        modelData.state = 'draft';
        modelData.acceptingApplicants = true;
      } else if (!event.saveState) {
        modelData.state = 'submitted';
        modelData.acceptingApplicants = true;
      }
      this.cleanup();
      this.options.model.trigger( modelData.id ? 'task:update' : 'task:save', modelData );
    });
  },

  toggleAccordion1: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion1.open = !this.data.accordion1.open;
    element.attr('aria-expanded', this.data.accordion1.open);
    element.siblings('.expandorama-content').attr('aria-hidden', !this.data.accordion1.open);
  },

  toggleAccordion2: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion2.open = !this.data.accordion2.open;
    element.attr('aria-expanded', this.data.accordion2.open);
    element.siblings('.expandorama-content').attr('aria-hidden', !this.data.accordion2.open);
  },

  toggleAccordion3: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion3.open = !this.data.accordion3.open;
    element.attr('aria-expanded', this.data.accordion3.open);
    element.siblings('.expandorama-content').attr('aria-hidden', !this.data.accordion3.open);
  },

  toggleAccordion4: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion4.open = !this.data.accordion4.open;
    element.attr('aria-expanded', this.data.accordion4.open);
    element.siblings('.expandorama-content').attr('aria-hidden', !this.data.accordion4.open);
  },

  toggleAccordion5: function (e) {
    var element = $(e.currentTarget);
    this.data.accordion5.open = !this.data.accordion5.open;
    element.attr('aria-expanded', this.data.accordion5.open);
    element.siblings('.expandorama-content').attr('aria-hidden', !this.data.accordion5.open);
  },

  validateFields: function () {
    var tags      = [];
    var oldTags   = [];
    var diff      = [];

    // check all of the field validation before submitting
    var children = this.$el.find( '.validate' );
    var abort = false;

    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );
    var target = $('.time-options-time-required.selected')[0] || {};

   
    if(target.id =='part-time' || target.id =='full-time'){ 
      if(this.changeDetailReimbursable()==true){
        abort= true;
      }
    }

    var completedBy = this.$('.time-options-time-required.selected').val() == 'One time' ?  TaskFormViewHelper.getCompletedByDate() : null; 
    if(completedBy) {
      var iAbort = false;
      try {
        iAbort = (new Date(completedBy).toISOString().split('T')[0]) !== completedBy || (this.isPastDate(completedBy)==true);
      } catch (err) {
        iAbort = true;
      }  
      if(iAbort) {             
        $('#time-options-completion-date').addClass('usa-input-error');  
        $('#time-options-completion-date input').addClass('usa-input-inline-error usa-input-inline');  
        $('#time-options-completion-date > .field-validation-error').show();     
      } else {
        $('#time-options-completion-date').removeClass('usa-input-error');
        $('#time-options-completion-date input').removeClass('usa-input-inline-error usa-input-inline'); 
        $('#time-options-completion-date > .field-validation-error').hide();
      }
      abort = abort || iAbort;
    }

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    return abort;
  },

  submit: function (e) {
    if ( e.preventDefault ) { e.preventDefault(); }
    if ( e.stopPropagation ) { e.stopPropagation(); }
    switch ($(e.currentTarget).data('state')) {
      case 'cancel':
        if(this.model.attributes.id) {
          Backbone.history.navigate('tasks/' + this.model.attributes.id, { trigger: true });
        } else {
          window.history.back();
        }
        break;
      case 'preview':
        if (!this.validateFields()) {
          this.preview(true);
        }
        break;
      case 'edit':
        this.preview(false);
        break;
      default:
        this.save(e);
        break;
    }
  },

  preview: function (showPreview) {
    if(showPreview) {
      $('#search-results-loading').show();
      var data = this.getDataFromPage();
      _.each(['description', 'details', 'outcome', 'about'], function (part) {
        if(data[part]) {
          data[part + 'Html'] = marked(data[part]);
        }
      });
      var tags = _(this.getTagsFromPage()).chain().map(function (tag) {
        if (!tag || !tag.id) { return; }
        return { name: tag.name, type: tag.type || tag.tagType };
      }).compact().value();
      var compiledTemplate = _.template(TaskPreviewTemplate)({
        data: data,
        madlibTags: organizeTags(tags),
      });
      $('#step-3').html(compiledTemplate);
      setTimeout(function () {
        $('#search-results-loading').hide();
      }, 50);
    }
    _.each(['#cancel', '#edit', '#preview', '#save', '#step-1', '#step-2', '#step-3'], function (id) {
      $(id).toggle();
    });
    window.scrollTo(0, 0);
  },

  save: function ( e ) {
    if ( e.preventDefault ) { e.preventDefault(); }
    var abort = this.validateFields();
    if ( abort === true ) {
      return;
    }
    switch ($(e.currentTarget).data('state')) {
      case 'draft':
        this.trigger( 'task:tags:save:done', { draft: true } );
        break;
      case 'submit':
        this.trigger( 'task:tags:save:done', { draft: false, saveState: false } );
        break;
      default:
        this.trigger( 'task:tags:save:done', { draft: false, saveState: true } );
        break;
    }
  },

  togglePeopleOptions: function (e) {
    $('.opportunity-people').removeClass('selected');
    if(e) {
      $(e.currentTarget).addClass('selected');
    } else {
      var opportunityPeople = this.data.data.peopleNeeded;
      if(this.data.data.peopleNeeded) {
        $('[value="' + this.data.data.peopleNeeded + '"]').addClass('selected');
      } else {
        $('[value="1"]').addClass('selected');
      }
    }
  },

  /*
   * Setup Time Options toggling
   */
  toggleTimeOptions: function (e) {
    $('.time-options-time-required').removeClass('selected');
    $('.time-required-description').hide();
    if(e) {
      $(e.currentTarget).addClass('selected');
    } else {
      var timeRequired = _.find(this.data.data.tags, { type: 'task-time-required'});
      if(timeRequired) {
        $('[value="' + timeRequired.name + '"]').addClass('selected');
      } else {
        $('[value="One time"]').addClass('selected');
      }
    }
    var target = $('.time-options-time-required.selected')[0] || {}; 
    $('#' + target.id + '-description').show();
    $('#time-options-time-required').hide();
    $('#time-options-completion-date').hide();
    $('#time-options-time-frequency').hide();
    $('#pay-scale-grade').hide();
    $('#detail-reimbursable').hide();
    $('#requirement-area').hide();
    $('#apply-participant-area').hide();
    $('#time-estimate').removeClass('validate');
    $('#js-time-frequency-estimate').removeClass('validate');
    $('#grade').removeClass('validate');
    $('#time-options-pay-scale').removeClass('validate');
    switch (target.id) {
      case 'one-time':
        $('#time-options-time-required').show();
        $('#time-estimate').addClass('validate');
        $('#time-options-completion-date').show();        
        break;
      case 'ongoing':
        $('#time-options-time-required').show();
        $('#time-estimate').addClass('validate');
        $('#time-options-time-frequency').show();
        $('#js-time-frequency-estimate').addClass('validate');
     
        break;
      case 'full-time':
        $('#time-estimate').addClass('validate');
        $('#detail-reimbursable').show();
        $('#time-options-time-required').show();        
        $('#requirement-area').show();
        $('#apply-participant-area').show();
      
        break;
      case 'part-time':
        $('#time-estimate').addClass('validate');
        $('#detail-reimbursable').show();
        $('#time-options-time-required').show();
        $('#requirement-area').show();
        $('#apply-participant-area').show();     
        break;
        
    }  
  },

  toggleLocationOptions: function (e) {
    $('.opportunity-location').removeClass('selected');
    if(e) {
      $(e.currentTarget).addClass('selected');
    } else {
      if(this.options.madlibTags['location']) {
        $('#specific-location').addClass('selected');
      } else {
        $('#anywhere').addClass('selected');
      }
    }
    var target = $('.opportunity-location.selected')[0]  || {};
    if(target.id != 'anywhere') {
      $('#s2id_task_tag_location').show();
    } else {
      $('#s2id_task_tag_location').hide();
    }
  },


  changeDetailReimbursable: function (){
    var abort= true;
    if($('[name=detail-group]:checked').length>0){ 
      $('#detail-reimbursable').removeClass('usa-input-error');       
      $('#detail-reimbursable>.field-validation-error').hide(); 
      abort = false;   
    } 
    else { 
      $('#detail-reimbursable').addClass('usa-input-error');   
      $('#detail-reimbursable>.field-validation-error').show();
      abort = true;     
    } 
    return abort;
  },

  toggleCareerField: function (e) {
    $('#opportunity-career-field').removeClass('validate');
    $('#opportunity-career-field').parent().removeClass('usa-input-error');
    $('#opportunity-career-field').siblings('.field-validation-error').hide();
    if(e) {
      if(e.currentTarget.value.toLowerCase() == 'true') {
        $('#s2id_opportunity-career-field').show();
        $('#opportunity-career-field').addClass('validate');
      } else {
        $('#s2id_opportunity-career-field').hide();
      }
    } else {
      if(this.options.madlibTags['career']) {
        $('#career-field-yes').attr('checked', 'checked');
        $('#s2id_opportunity-career-field').show();
        $('#opportunity-career-field').addClass('validate');
      } else {
        $('#career-field-no').attr('checked', 'checked');
        $('#s2id_opportunity-career-field').hide();
      }
    }
  },

  displayChangeOwner: function (e) {
    e.preventDefault();
    this.$('.project-owner').hide();
    this.$('.change-project-owner').show();

    return this;
  },
  displayAddParticipant: function (e) {
    e.preventDefault();
    this.$('.project-no-people').hide();
    this.$('.add-participant').show();

    return this;
  },

  getDataFromPage: function () {
    var modelData = {
      id           : this.model.get('id'),
      communityId  : $('#federal-programs').val(),
      title        : this.$('#task-title').val(),
      description  : this.$('#opportunity-introduction').val(),
      details      : this.$('#opportunity-details').val(),
      outcome      : this.$('#opportunity-skills').val(),
      about        : this.$('#opportunity-team').val(),
      submittedAt  : this.$('#js-edit-date-submitted').val() || null,
      publishedAt  : this.$('#publishedAt').val() || null,
      assignedAt   : this.$('#assignedAt').val() || null,
      completedAt  : this.$('#completedAt').val() || null,
      state        : this.model.get('state'),
      restrict     : this.model.get('restrict'),
      peopleNeeded : this.$('.opportunity-people.selected').val(),
      grade: '',
      payLevelId: null
    };

    if( this.$('.time-options-time-required.selected').val() == 'Part Time Detail'|| this.$('.time-options-time-required.selected').val() == 'Full Time Detail'){
      modelData.applyAdditional=this.$('#opportunity-apply').val();
      modelData.requirement  =this.$('#opportunity-requirement').val();
      modelData.isDetailReimbursable= $("input[name='detail-group']:checked").val();
      modelData.reimbursable= $("input[name='detail-group']:checked").val() =='true' ? 'Yes' :'No';
    }
    else{
      modelData.applyAdditional= '';
      modelData.requirement  ='';
      modelData.isDetailReimbursable= null;
    }
 
    if (this.agency) {
      modelData.restrictedTo = _($('input[name=task-restrict-agency]:checked')).pluck('value')[0];
    }

    var completedBy    = this.$('.time-options-time-required.selected').val() == 'One time' ?  TaskFormViewHelper.getCompletedByDate() : null;
    if (completedBy) {
      var timezoneOffset = (new Date()).getTimezoneOffset() * 60000;
      completedBy = new Date(completedBy);
      modelData[ 'completedBy' ] = new Date(completedBy.getTime() + timezoneOffset);
    } else {
      modelData[ 'completedBy' ] = null;
    }

    modelData.tags = _(this.getTagsFromPage()).chain().map(function (tag) {
      if (!tag || !tag.id) { return; }
      return (tag.id && tag.id !== tag.name) ? parseInt(tag.id, 10) : {
        name: tag.name,
        type: tag.tagType,
        data: tag.data,
      };
    }).compact().value();

    return modelData;
  },

  getTagsFromPage: function () {
    // Gather tags for submission after the task is created
    var tags = [];
    var taskTimeDescription = $('.time-options-time-required.selected').val();
    var taskTimeTag = _.find(this.tagSources['task-time-required'], { name: taskTimeDescription });
    var taskPeopleTag = _.find(this.tagSources['task-people'], { id: parseInt($('#people').select2('data').id || '0') });  
    if (taskTimeTag) {
      tags.push.apply(tags, [taskTimeTag]);
    }
    if (taskPeopleTag) {
      tags.push.apply(tags, [taskPeopleTag]);
    }
    tags.push.apply(tags,this.$('#task_tag_skills').select2('data'));
    if($('.opportunity-location.selected').val() !== 'anywhere') {
      tags.push.apply(tags,this.$('#task_tag_location').select2('data'));
    }
    tags.push.apply(tags,this.$('#opportunity-series').select2('data'));
    tags.push.apply(tags,this.$('#task_tag_keywords').select2('data'));
    if($('[name=CareerField]:checked').val().toLowerCase() == 'true') {
      var taskCareerTag = _.find(this.tagSources['career'], { id: parseInt($('#opportunity-career-field').select2('data').id || '0') });
      tags.push.apply(tags, [taskCareerTag]);
    }
    if (taskTimeDescription === 'One time' || taskTimeDescription === 'Ongoing' || taskTimeDescription === 'Part Time Detail' ||taskTimeDescription === 'Full Time Detail' ) {
      var taskEstimateTag = _.find(this.tagSources['task-time-estimate'], { id: parseInt($('#time-estimate').select2('data').id || '0') });
      tags.push.apply(tags, [taskEstimateTag]);
    }
    if (taskTimeDescription === 'Ongoing') {
      var taskLengthTag = _.find(this.tagSources['task-length'], { id: parseInt($('#js-time-frequency-estimate').select2('data').id || '0') });
      tags.push.apply(tags,[taskLengthTag]);
    }    
    return tags;
  },

  getOldTags: function () {
    var oldTags = [];
    for (var i in this.options.tags) {
      oldTags.push({
        id: parseInt(this.options.tags[i].id),
        tagId: parseInt(this.options.tags[i].tag.id),
        type: this.options.tags[i].tag.type,
      });
    }
    return oldTags;
  },
  initializePayLevel: function () {
    $.ajax({
      url: '/api/enumerations/payPlans', 
      type: 'GET',
      async: false,
      success: function (data) {
        this.payPlans= data;             
      }.bind(this),
    });
  },

  cleanup: function () {
    if (this.md1) { this.md1.cleanup(); }
    if (this.md2) { this.md2.cleanup(); }
    if (this.md3) { this.md3.cleanup(); }
    if (this.md4) { this.md4.cleanup(); }
    removeView(this);
  },
});

_.extend(TaskEditFormView.prototype, ShowMarkdownMixin);

module.exports = TaskEditFormView;
