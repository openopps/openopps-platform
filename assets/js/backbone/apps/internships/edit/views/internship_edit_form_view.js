var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var UIConfig = require('../../../../config/ui.json');
var marked = require('marked');
var MarkdownEditor = require('../../../../components/markdown_editor');
var TagFactory = require('../../../../components/tag_factory');
var ShowMarkdownMixin = require('../../../../components/show_markdown_mixin');

var InternshipEditFormTemplate = require('../templates/internship_edit_form_template.html');
var InternshipPreviewTemplate = require('../templates/internship_preview_template.html');
var ModalComponent = require('../../../../components/modal');

var InternshipEditFormView = Backbone.View.extend({

  events: {
    'blur .validate'                      : 'validateField',
    'change .validate'                    : 'validateField',
    'click #change-owner'                 : 'displayChangeOwner',
    'click #add-participant'              : 'displayAddParticipant',
    'click #add-language'                 : 'toggleLanguagesOn',
    'click #cancel-language'              : 'toggleLanguagesOff',
    'click #save-language'                : 'toggleLanguagesOff',
    'click .usa-button'                   : 'submit',   
    'click .opportunity-location'         : 'toggleInternLocationOptions',
    'click .expandorama-button-skills'    : 'toggleAccordion1',
    'click .expandorama-button-team'      : 'toggleAccordion2',
    'click .expandorama-button-keywords'  : 'toggleAccordion3',
    'change input[name=needed-interns]'   : 'changedInternsNeed',
    'change input[name=internship-timeframe]'   : 'changedInternsTimeFrame',
  },

  initialize: function (options) {
    _.extend(this, Backbone.Events);

    var view                    = this;
    this.options                = options;
    this.tagFactory             = new TagFactory();
    this.owner                  = this.model.get( 'owner' );
    this.agency                 = this.owner ? this.owner.agency.data : window.cache.currentUser.agency;
    this.data                   = {};
    this.data.newTag            = {};

   
    this.tagSources = options.tagTypes;  // align with naming in TaskFormView, so we can share completionDate

    this.initializeListeners();

    this.listenTo(this.options.model, 'task:update:success', function (data) {
      Backbone.history.navigate('tasks/' + data.attributes.id, { trigger: true });
      if(data.attributes.state == 'submitted') {
        this.modalComponent = new ModalComponent({
          el: '#site-modal',
          id: 'submit-opp',
          modalTitle: 'Submitted',
          modalBody: 'Thanks for submitting the <strong>' + data.attributes.title + '</strong>. We\'ll review it and let you know if it\'s approved or if we need more information.',
          primary: {
            text: 'Close',
            action: function () {
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
  changedInternsNeed: function (e){  
    if($('[name=needed-interns]:checked').length>0){      
      $('#intern-need>.field-validation-error').hide();
    }
  },
  changedInternsTimeFrame: function (e){
    if($('[name=internship-timeframe]:checked').length>0){     
      $('#internship-start-End>.field-validation-error').hide();
     
    }
  },
  render: function () {
    var compiledTemplate;

    this.data = {
      data: this.model.toJSON(),
      tagTypes: this.options.tagTypes,
      newTags: [],
      newItemTags: [],
      tags: this.options.tags,
      madlibTags: this.options.madlibTags,
      ui: UIConfig,
      agency: this.agency,
      accordion1: {
        open: false,
      },
      accordion2: {
        open: false,
      },
      accordion3: {
        open: false,
      },
    };

    compiledTemplate = _.template(InternshipEditFormTemplate)(this.data);
    this.$el.html(compiledTemplate);
    this.$el.localize();

    // DOM now exists, begin select2 init
    this.initializeSelect2(); 
    this.initializeTextAreaDetails();
    this.initializeTextAreaSkills();
    this.initializeTextAreaTeam();
    if(!_.isEmpty(this.data['madlibTags'].keywords)) {
      $('#keywords').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#keywords').attr('aria-hidden', false);
    }

    this.$( '.js-success-message' ).hide();
    this.toggleInternLocationOptions();  
    $('#search-results-loading').hide();
    return this;
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
      validate: ['empty','html'],
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
      validate: ['html'],
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
      validate: ['html'],
    }).render();
    if(this.model.toJSON().about) {
      $('#team').siblings('.expandorama-button').attr('aria-expanded', true);
      $('#team').attr('aria-hidden', false);
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

  toggleLanguagesOn: function (e) {
    var element = $(e.currentTarget);
    $('.usajobs-form__title').hide();
    $('.usajobs-form__title').attr('aria-hidden');
    $('#tips').hide();
    $('#tips').attr('aria-hidden');
    $('#step-1').hide();
    $('#step-1').attr('aria-hidden');
    $('#step-2').hide();
    $('#step-2').attr('aria-hidden');
    $('#step-3').hide();
    $('#step-3').attr('aria-hidden');
    $('#button-bar').hide();    
    $('#button-bar').attr('aria-hidden');
    $('#add-languages-fieldset').show();
    $('#add-languages-fieldset').removeAttr('aria-hidden');
    window.scrollTo(0, 0);
  },

  toggleLanguagesOff: function (e) {
    var element = $(e.currentTarget);
    $('.usajobs-form__title').show();
    $('.usajobs-form__title').removeAttr('aria-hidden');
    $('#tips').show();
    $('#tips').removeAttr('aria-hidden');
    $('#step-1').show();
    $('#step-1').removeAttr('aria-hidden');
    $('#step-2').show();
    $('#step-2').removeAttr('aria-hidden');
    $('#step-3').show();
    $('#step-3').removeAttr('aria-hidden');
    $('#button-bar').show();
    $('#button-bar').removeAttr('aria-hidden');
    $('#add-languages-fieldset').hide();
    $('#add-languages-fieldset').attr('aria-hidden');
    window.scrollTo(0, 0);
  },

  validateFields: function () {
   
    // check all of the field validation before submitting
    var children = this.$el.find( '.validate' );
    var abort = false;
    // eslint-disable-next-line no-empty
    if($('[name=needed-interns]:checked').length==0){      
      $('#intern-need>.field-validation-error').show();
      abort=true;
    }
    if($('[name=internship-timeframe]:checked').length==0){     
      $('#internship-start-End>.field-validation-error').show();
      abort=true;
    }
  
    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );

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
      var data = this.getDataFromPage();
      console.log(data);
      _.each(['description', 'details', 'about','outcome'], function (part) {
        if(data[part]) {
          data[part + 'Html'] = marked(data[part]);
        }
      });
      var tags = _(this.getTagsFromInternPage()).chain().map(function (tag) {
        if (!tag || !tag.id) { return; }
        return { name: tag.name, type: tag.type || tag.tagType };
      }).compact().value();

      var compiledTemplate = _.template(InternshipPreviewTemplate)({
        data: data,
        madlibTags:this.organizeTags(tags),
      });
  
      $('#internship-preview').html(compiledTemplate);
    }
    _.each(['#cancel', '#edit', '#preview', '#save', '#internship-edit', '#internship-preview'], function (id) {
      $(id).toggle();
    });
    window.scrollTo(0, 0);
  },

  organizeTags: function (tags) {
    // put the tags into their types
    return _(tags).groupBy('type');
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

  toggleInternLocationOptions: function (e) {
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
      console.log(target.id);
      $('#s2id_task_tag_location').show();
      $('.intern-tag-address').show();
      $('#task_tag_country').addClass('validate');
      $('#task_tag_state').addClass('validate');
      $('#task_tag_city').addClass('validate');
    } else {
      $('#s2id_task_tag_location').hide();
      $('.intern-tag-address').hide();
      $('#task_tag_country').removeClass('validate');
      $('#task_tag_state').removeClass('validate');
      $('#task_tag_city').removeClass('validate');
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
      id          : this.model.get('id'),
      title       : this.$('#intern-title').val(),
      description : this.$('#opportunity-details').val(),  
      details     : this.$('#opportunity-details').val(),  
      about       : this.$('#opportunity-team').val(),
      submittedAt : this.$('#js-edit-date-submitted').val() || null,
      publishedAt : this.$('#publishedAt').val() || null,
      assignedAt  : this.$('#assignedAt').val() || null,
      completedAt : this.$('#completedAt').val() || null,
      state       : this.model.get('state'),
      restrict    : this.model.get('restrict'),
    };

    
    modelData.tags = _(this.getTagsFromInternPage()).chain().map(function (tag) {
      console.log(tag);
      if (!tag || !tag.id) { return; }
      return (tag.id && tag.id !== tag.name) ? parseInt(tag.id, 10) : {
        name: tag.name,
        type: tag.tagType,
        data: tag.data,
      };
    }).compact().value();

    
    return modelData;
  },

  getTagsFromInternPage: function () {
    // Gather tags for submission after the task is created
    var tags = [];
    
    tags.push.apply(tags,this.$('#task_tag_skills').select2('data'));
    if($('.opportunity-location.selected').val() !== 'anywhere') {
      tags.push.apply(tags,this.$('#task_tag_location').select2('data'));
    }
    console.log(tags);  
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

  cleanup: function () {
    if (this.md1) { this.md1.cleanup(); }
    if (this.md2) { this.md2.cleanup(); }
    if (this.md3) { this.md3.cleanup(); }
    if (this.md4) { this.md4.cleanup(); }
    removeView(this);
  },
});

_.extend(InternshipEditFormView.prototype, ShowMarkdownMixin);

module.exports = InternshipEditFormView;
