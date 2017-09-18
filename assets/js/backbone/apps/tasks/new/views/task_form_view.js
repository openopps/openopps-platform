var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');
var Bootstrap = require('bootstrap');

var MarkdownEditor = require('../../../../components/markdown_editor');
var ShowMarkdownMixin = require('../../../../components/show_markdown_mixin');
var TagFactory = require('../../../../components/tag_factory');
var TaskModel = require('../../../../entities/tasks/task_model');
var TaskFormViewHelper = require('../../task-form-view-helper');

// templates
var fs = require('fs');
var TaskFormTemplate = fs.readFileSync(`${__dirname}/../templates/task_form_template.html`).toString();

var i18n = require('i18next');
require('jquery-i18next');

var TaskFormView = Backbone.View.extend({

  el: '#container',

  events: {
    'change .validate'                : 'v',
    'click [name=task-time-required]' : 'toggleTimeOptions',
    'change #task-location'           : 'locationChange',
    'click #js-task-draft'            : 'saveDraft',
    'click #js-task-create'           : 'submit',
  },

  /*
   * Initialize the Task Creation Form ViewController.
   */
  initialize: function (options) {
    this.options = _.extend(options, this.defaults);
    this.agency = window.cache.currentUser.agency;
    this.tasks = this.options.tasks;
    this.tagFactory = new TagFactory();
    this.data = {};
    this.data.newTag = {};
    this.data.newItemTags = [];
    this.data.existingTags = [];
    this.initializeSelect2Data();
    this.initializeListeners();

    // Check if the collection already contains a task. Otherwise, create one.
    this.model = this.collection.first();

    if ( _.isUndefined( this.model ) ) {

      this.model = new TaskModel();

    }

  },

 /*
  * Initialize the Select2Data custom select components.
  */
  initializeSelect2Data: function () {
    var self = this;
    var types = [
      'task-time-required',
      'task-length',
      'task-time-estimate',
      'task-skills-required',
      'task-people',
    ];

    this.tagSources = {};
    var requestAllTagsByType = function (type) {
      $.ajax({
        url: '/api/ac/tag?type=' + type + '&list',
        type: 'GET',
        async: false,
        success: function (data) {
          if (!window.cache.currentUser) {
            window.location = '/';
            return;
          }
          if (type === 'task-time-estimate' || type === 'task-length') {
            data = _.sortBy(data, 'updatedAt');
          }
          else if (type === 'task-time-required') {
            data = TaskFormViewHelper.annotateTimeRequired(data, self.agency);
          }
          self.tagSources[type] = data;
        },
      });
    };

    async.each(types, requestAllTagsByType, function () {
      self.render();
    });
  },

  /*
   * Initialize the event listeners for this ViewController.
   */
  initializeListeners: function () {
    var view = this;

    _.extend(this, Backbone.Events);
    this.collection.on( 'task:draft:success', function (task) {
      view.renderSaveSuccessModal(true);
    });
  },

  /*
   * Render the View
   */
  render: function () {

    // Template data
    //
    var data = {

      tags: this.tagSources,
      model: this.model,
      agency: this.agency,
    };

    var template = _.template( TaskFormTemplate )( data );

    this.$el.html( template );
    this.initializeSelect2();
    this.initializeTextArea();
    this.initializeShowMarkdown({
      el               : '.show-markdown',
      id               : 'show-default-description',
      displayCondition : 'Full Time Detail',
      textAreaId       : 'task-description',
    });

    var restrictAgencyArea     = this.$('#task-restrict-agency-area');
    var restrictAgency         = this.$('#task-restrict-agency');

    if (this.agency.allowRestrictAgency === true) {
      restrictAgencyArea.show();
      if (this.model.restrict) this.$( '#task-restrict-agency' ).val(true);
    } else {
      restrictAgencyArea.hide();
    }
    this.$el.localize();
    this.renderSaveSuccessModal(false);
    this.toggleTimeOptions();

    // Return this for chaining.
    return this;

  },

  /*
   * Render modal for the Task Creation Form ViewController
   */
  renderSaveSuccessModal: function (show) {
    var $modal = this.$( '.js-success-message' );
    var owner = this.model.attributes.owner;

    if (show && owner) {
      $modal.find( '.js-profile-link' ).attr( 'href', '/profile/' + owner.id );
      $modal.slideDown( 'slow' );
      $modal.one( 'mouseout', function ( e ) {
        _.delay( _.bind( $modal.slideUp, $modal, 'slow' ), 4200 );
      });
    } else {
      $modal.hide();
    }

  },

  /*
   * Validation event handler
   */
  v: function (e) {
    return validate(e);
  },

  /*
   * Initialize Select2Data again?
   */
  initializeSelect2: function () {
    var self = this;

    self.tagFactory.createTagDropDown( {
      type:'skill',
      selector:'#js-task-tag',
      width: '100%',
      tokenSeparators: [','],
      placeholder:'Start typing to select a tag',
    } );
    self.tagFactory.createTagDropDown( {
      type:'location',
      selector:'#js-task-location',
      tokenSeparators: [','],
    } );

    // ------------------------------ //
    // PRE-DEFINED SELECT MENUS BELOW //
    // ------------------------------ //

    self.$('#time-required').select2({
      placeholder: 'Time Commitment',
      width: 'resolve',
    });

    self.$('#js-time-frequency-estimate').select2({
      placeholder: 'Frequency of work',
      width: 'fullwidth',
    });

    self.$('#js-task-time-estimate').select2({
      placeholder: 'Estimated Time Required',
      width: 'resolve',
    });

    self.$('#task-location').select2({
      placeholder: 'Work Location',
      width: 'resolve',
    });

    self.$('#js-participant-selection').select2({
      placeholder: 'People required',
      width: 'resolve',
    });

  },

  /*
   * Initialize Markdown Editor Text Area
   */
  initializeTextArea: function ( options ) {

    var defaults = _.extend( {
      data: '',
      el: '.markdown-edit',
      id: 'task-description',
      title: i18n.t('Task') + ' Description',
      rows: 6,
      validate: ['empty'],
    }, options );

    if ( this.md ) { this.md.cleanup(); }

    this.md = new MarkdownEditor( defaults ).render();

  },

  /*
   * Setup Time Options toggling
   */
  toggleTimeOptions: function (e) {
    TaskFormViewHelper.toggleTimeOptions(this);
  },

  locationChange: function (e) {
    if (_.isEqual(e.currentTarget.value, 'true')) {
      this.$('.el-specific-location').show();
    } else {
      this.$('.el-specific-location').hide();
    }
  },

  /*
   * Validate before submitting the form and saving the task.
   */
  validateBeforeSubmit: function () {

    var view = this;
    var fieldsToValidate  = [
      '#task-title',
      '#task-description',
      '[name=task-time-required]:checked',
      '[name=time-required]:checked',
    ];
    var field = '';
    var valid = false;

    for ( var i = 0; i < fieldsToValidate.length; i++ ) {

      // README: view.v() return true if there *is* a validation error
      // it returns false if there *is not*.
      //
      field = fieldsToValidate[ i ];
      valid = view.v( { currentTarget: field } );

      if ( true === valid ) { return false; }

    }

    return true;

  },

  /*
   * Save a draft
   * This method sends the data to the server and saves the task.
   * @param { Object } event A jQuery event object
   */
  saveDraft: function ( event ) {
    var view = this;

    this.setUpModel( 'draft' );

    this.collection.trigger( 'task:draft', this.model );

  },

  /**
   * Sets up the model in one place regardless of the state.
   * This method is called on the saveDraft and the submit methods.
   * @param { string } state - The state as a string, can be either draft or submitted
   * @see TaskFormView#submit()
   * @see TaskFormView#saveDraft()
   */
  setUpModel: function ( state ) {

    this.model.set( {
      title        :  this.$( '#task-title' ).val(),
      description  :  this.$( '#task-description' ).val(),
      state        :  state,
      tags         :  this.getTags(),
      restrict     : {
        name: this.agency.name,
        abbr: this.agency.abbr,
        slug: this.agency.slug,
        domain: this.agency.slug + '.gov',
        projectNetwork: this.$(  '#task-restrict-agency'  ).prop( 'checked' ),
      },
    } );

  },

  /*
   * Submit event handler.
   * This method sends the data to the server and saves the task
   * @param { Object } e jQuery event object
   * @return { TaskFormView } this
   */
  submit: function ( e ) {

    var validForm = this.validateBeforeSubmit();
    var completedBy = this.$( '#estimated-completion-date' ).val();

    if ( ! validForm ) { return this; }

    this.setUpModel( 'submitted' );

    if ( ! _.isEmpty( completedBy ) ) {

      this.model.set( 'completedBy', completedBy );

    }

    this.collection.trigger( 'task:save', this.model );

    return this;
  },

  /*
   * Get tags from the "New Task" form. This method will sanatize and serialize
   * the data related to tags in the new task form. If there is no data in the tag
   * fields it must be removed otherwise the server will respond with a 500 error
   * when attempting to parse non-existant tags in the Waterline ORM.
   * @return { Array } A collection of tags mapped to an array
   *
   */
  getTags: function getTags () {
    var tags        = [];
    var tagSkills   = this.$( '#js-task-tag' ).select2( 'data' );
    var tagLocation = this.$( '#js-task-location' ).select2( 'data' );
    var peopleCount = this.$( '#js-participant-selection' ).select2( 'data' );
    var timeRequiredTagId  = this.$( '[name=task-time-required]:checked' ).val();
    var timeRequiredTag = _.findWhere(this.tagSources['task-time-required'], {id: parseInt(timeRequiredTagId)});

    // check for the presence of data in these fields
    // no data means no tags are supplied
    // don't send those tags because the API returns 500
    if ( tagSkills != [] ) tags.push.apply( tags, tagSkills );
    if ( tagLocation != [] ) tags.push.apply( tags, tagLocation );
    if ( peopleCount != [] ) tags.push( peopleCount );
    if ( timeRequiredTag ) tags.push.apply( tags,[ timeRequiredTag ] );

    // if time selection is NOT full-time, make sure to include
    // the other tags
    if ( timeRequiredTag.value === 'One time' ) { // time selection is 'One time'
      tags.push.apply( tags,[ this. $( '#js-task-time-estimate' ).select2( 'data' ) ] );
    } else if ( timeRequiredTag.value === 'Ongoing' ) { // time selection is 'On going'
      tags.push.apply( tags,[ this. $( '#js-task-time-estimate' ).select2( 'data' ) ] );
      tags.push.apply( tags,[ this. $( '#js-time-frequency-estimate' ).select2( 'data' ) ] );
    }

    tags = _( tags ).map( function ( tag ) {
      return ( tag.id && tag.id !== tag.name && tag.id !== undefined ) ? +tag.id : {
        name: tag.name,
        type: tag.tagType,
        data: tag.data,
      };
    } );
    return tags;
  },

  /*
   * Clean up the review by removing it and child components from memory.
   */
  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    removeView(this);
  },

});

_.extend(TaskFormView.prototype, ShowMarkdownMixin);

module.exports = TaskFormView;
