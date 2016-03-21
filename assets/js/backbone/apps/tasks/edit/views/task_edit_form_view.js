var _ = require('underscore');
var Backbone = require('backbone');
var UIConfig = require('../../../../config/ui.json');
var marked = require('marked');
var MarkdownEditor = require('../../../../components/markdown_editor');
var TaskEditFormTemplate = require('../templates/task_edit_form_template.html');
var TagFactory = require('../../../../components/tag_factory');
var ShowMarkdownMixin = require('../../../../components/show_markdown_mixin');


var TaskEditFormView = Backbone.View.extend({

  events: {
    'blur .validate'                   : 'v',
    'click #change-owner'              : 'displayChangeOwner',
    'click #add-participant'           : 'displayAddParticipant',
    'click #task-view'                 : 'view',
    'submit #task-edit-form'           : 'submit',
    'click .js-task-draft'             : 'saveDraft',
    'change [name=task-time-required]' : 'timeRequiredChanged',
  },

  initialize: function (options) {

    _.extend(this, Backbone.Events);

    var view                    = this;
    this.options                = options;
    this.tagFactory             = new TagFactory();
    this.data                   = {};
    this.data.newTag            = {};

    this.initializeListeners();

    // Register listener to task update, the last step of saving
    //
    this.listenTo( this.options.model, 'task:update:success', function ( data ) {

      if ( 'draft' === data.attributes.state ) {

        view.renderSaveSuccessModal();

      } else {

        Backbone.history.navigate( 'tasks/' + data.attributes.id, { trigger: true } );

      }

    } );

  },

  view: function (e) {
    if (e.preventDefault) e.preventDefault();
    Backbone.history.navigate('tasks/' + this.model.attributes.id, { trigger: true });
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

  v: function (e) {
    return validate(e);
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
    };

    compiledTemplate = _.template(TaskEditFormTemplate)(this.data);
    this.$el.html(compiledTemplate);
    this.$el.i18n();

    // DOM now exists, begin select2 init
    this.initializeSelect2();
    this.initializeTextArea();
    this.initializeShowMarkdown({
      el               : '.show-markdown',
      id               : 'show-default-description',
      displayCondition : 'Full Time Detail',
      textAreaId       : 'task-description',
    });

    // Set up time pickers
    this.$( '#js-edit-date-submitted' ).datetimepicker( {
      defaultDate: this.data.data.submittedAt,
    } );

    $('#publishedAt').datetimepicker({
      defaultDate: this.data.data.publishedAt,
    });

    if (this.data.data.assignedAt) {
      $('#assignedAt').datetimepicker({
        defaultDate: this.data.data.assignedAt,
      });
    }

    if (this.data.data.completedAt) {
      $('#completedAt').datetimepicker({
        defaultDate: this.data.data.completedAt,
      });
    }

    this.$( '.js-success-message' ).hide();

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

    this.$('#owner').select2({
      placeholder: 'task owner',
      multiple: false,
      formatResult: formatResult,
      formatSelection: formatResult,
      allowClear: false,
      ajax: {
        url: '/api/ac/user',
        dataType: 'json',
        data: function (term) {
          return { q: term };
        },
        results: function (data) {
          return { results: data };
        },
      },
    });
    if (this.data.data.owner) {
      this.$('#owner').select2('data', this.data.data.owner);
    }

    this.$('#participant').select2({
      placeholder: 'Add participant',
      multiple: false,
      formatResult: formatResult,
      formatSelection: formatResult,
      allowClear: false,
      ajax: {
        url: '/api/ac/user',
        dataType: 'json',
        data: function (term) {
          return { q: term };
        },
        results: function (data) {
          return { results: data };
        },
      },
    });

    this.tagFactory.createTagDropDown({
      type: 'skill',
      selector: '#task_tag_skills',
      width: '100%',
      tokenSeparators: [','],
      data: this.data['madlibTags'].skill,
    });

    this.tagFactory.createTagDropDown({
      type: 'location',
      selector: '#task_tag_location',
      width: '40%',
      data: this.data['madlibTags'].location,
    });

    $('#skills-required').select2({
      placeholder: 'required/not-required',
      width: '200px',
    });

    $('#time-required').select2({
      placeholder: 'time-required',
      width: '130px',
    });

    $('#people').select2({
      placeholder: 'people',
      width: '150px',
    });

    $('#length').select2({
      placeholder: 'length',
      width: '130px',
    });

    $('#time-estimate').select2({
      placeholder: 'time-estimate',
      width: '200px',
    });

    $('#task-location').select2({
      placeholder: 'location',
      width: '130px',
    });

  },

  initializeTextArea: function () {
    if (this.md) { this.md.cleanup(); }
    this.md = new MarkdownEditor({
      data: this.model.toJSON().description,
      el: '.markdown-edit',
      id: 'task-description',
      placeholder: 'Description of opportunity including goals, expected outcomes and deliverables.',
      title: 'Opportunity Description',
      rows: 6,
      validate: ['empty'],
    }).render();
  },

  /*
   * Initialize the `task:tags:save:done` listener for this view.
   * The event is triggered from the `submit` & `saveDraft` methods.
   */
  initializeListeners: function () {

    var view = this;

    this.on( 'task:tags:save:done', function ( event ) {

      var owner          = this.$( '#owner' ).select2( 'data' );
      var completedBy    = this.$( '#estimated-completion-date' ).val();
      var newParticipant = this.$( '#participant' ).select2( 'data' );
      var silent         = true;

      var modelData = {
        id          : this.model.get( 'id' ),
        title       : this.$( '#task-title' ).val(),
        description : this.$( '#task-description' ).val(),
        submittedAt : this.$( '#js-edit-date-submitted' ).val() || undefined,
        publishedAt : this.$( '#publishedAt' ).val() || undefined,
        assignedAt  : this.$( '#assignedAt' ).val() || undefined,
        completedAt : this.$( '#completedAt' ).val() || undefined,
        projectId   : null,
        state       : this.model.get( 'state' ),
      };


      // README: Check if draft is being saved or if this is a submission.
      // If the state isn't a draft and it isn't simply being saved, then it will
      // be submitted for review. `event.saveState` is true if the task is not a
      // `draft` and assumes that the task is simply being updated rather than
      // there being a need to "Submit for Review".
      //
      if ( ! event.draft && ! event.saveState ) {
        modelData.state = 'submitted';
      }

      if ( owner ) { modelData[ 'userId' ] = owner.id; }
      if ( completedBy != '' ) { modelData[ 'completedBy' ] = completedBy; }
      if ( newParticipant ) {
        if ( this.$( '#participant-notify:checked' ).length > 0 ) { silent = false; }
        $.ajax( {
          url: '/api/volunteer',
          method: 'POST',
          data: {
            taskId: view.model.get( 'id' ),
            userId: newParticipant.id,
            silent: silent,
          },
          success: function ( e ) {
            console.log( 'success adding participant', e );
          },
          error: function ( e ) {
            console.log( 'error adding participant', e );
          },
        } );
      }

      var tags = _( this.getTagsFromPage() )
        .chain()
        .map( function ( tag ) {
          if ( ! tag || ! tag.id ) { return; }
          return ( tag.id && tag.id !== tag.name ) ? parseInt( tag.id, 10 ) : {
            name: tag.name,
            type: tag.tagType,
            data: tag.data,
          };
        } )
        .compact()
        .value();

      modelData.tags = tags;

      this.options.model.trigger( 'task:update', modelData );

    } );

  },

  saveDraft: function () {
    this.trigger( 'task:tags:save:done', { draft: true } );
  },

  submit: function ( e ) {

    if ( e.preventDefault ) { e.preventDefault(); }

    var tags      = [];
    var oldTags   = [];
    var diff      = [];
    var saveState = false;

    if ( 'save' === this.$( '#js-task-create' ).data( 'state' ) ) {
      saveState = true;
    }

    // check all of the field validation before submitting
    var children = this.$el.find( '.validate' );
    var abort = false;

    _.each( children, function ( child ) {
      var iAbort = validate( { currentTarget: child } );
      abort = abort || iAbort;
    } );

    if ( abort === true ) {
      return;
    }

    return this.trigger( 'task:tags:save:done', { draft: false, saveState: saveState } );

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

  getTagsFromPage: function () {

    // Gather tags for submission after the task is created
    var tags = [],
      taskTimeTag = this.$('[name=task-time-required]:checked').val();

    if (taskTimeTag) {
      tags.push.apply(tags,[{
        id: parseInt(taskTimeTag),
        type: 'task-time-required',
      }]);
    }

    tags.push.apply(tags,this.$('#task_tag_skills').select2('data'));
    tags.push.apply(tags,this.$('#task_tag_location').select2('data'));
    tags.push.apply(tags,[this.$('#people').select2('data')]);
    tags.push.apply(tags,[this.$('#time-required').select2('data')]);
    tags.push.apply(tags,[this.$('#time-estimate').select2('data')]);
    tags.push.apply(tags,[this.$('#length').select2('data')]);

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
    if (this.md) { this.md.cleanup(); }
    removeView(this);
  },

});

_.extend(TaskEditFormView.prototype, ShowMarkdownMixin);

module.exports = TaskEditFormView;
