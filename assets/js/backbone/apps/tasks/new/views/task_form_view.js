define([
    'jquery',
    'bootstrap',
    'underscore',
    'backbone',
    'async',
    'utilities',
    'markdown_editor',
    'tasks_collection',
    'text!task_form_template',
    'tag_factory'
], function ($, Bootstrap, _, Backbone, async, utilities, MarkdownEditor, TasksCollection, TaskFormTemplate, TagFactory) {

  var TaskFormView = Backbone.View.extend({

    el: "#task-list-wrapper",

    events: {
      "blur .validate"        : "v",
      "change #task-location" : "locationChange"
    },

    initialize: function (options) {
      this.options = _.extend(options, this.defaults);
      this.tasks = this.options.tasks;
      this.tagFactory = new TagFactory();
      this.data = {};
      this.data.newTags = [];
      this.initializeSelect2Data();
      this.initializeListeners();
    },

    initializeSelect2Data: function () {
      var self = this;
      var types = ["task-skills-required", "task-time-required", "task-people", "task-length", "task-time-estimate"];

      this.tagSources = {};

      var requestAllTagsByType = function (type) {
        $.ajax({
          url: '/api/ac/tag?type=' + type + '&list',
          type: 'GET',
          async: false,
          success: function (data) {
            self.tagSources[type] = data;
          }
        });
      }

      async.each(types, requestAllTagsByType, function (err) {
        self.render();
      });
    },
    initializeListeners: function() {
      var self = this;
      
      _.extend(this, Backbone.Events);

      self.on('newTagSaveDone',function (){

        tags = [];
        tags.push.apply(tags, self.$("#topics").select2('data'));
        tags.push.apply(tags, self.$("#skills").select2('data'));
        tags.push(self.$("#skills-required").select2('data'));
        tags.push(self.$("#people").select2('data'));
        tags.push(self.$("#time-required").select2('data'));
        tags.push(self.$("#time-estimate").select2('data'));
        tags.push(self.$("#length").select2('data'));

        if (self.$("#task-location").select2('data').id == 'true') {
          tags.push.apply(tags, self.$("#location").select2('data'));
        }

        console.log("tags ",tags);

        async.each(tags, self.tagFactory.addTag.bind(null,self), function (err) {
          self.model.trigger("task:modal:hide");
          self.model.trigger("task:tags:save:success", err);
        });
      });


      this.listenTo(this.tasks,"task:save:success", function (taskId){

        self.tempTaskId = taskId;
        console.log("here");
          // Gather tags for submission after the task is created
        tags = [];
        tags.push.apply(tags, self.$("#topics").select2('data'));
        tags.push.apply(tags, self.$("#skills").select2('data'));
        tags.push(self.$("#skills-required").select2('data'));
        tags.push(self.$("#people").select2('data'));
        tags.push(self.$("#time-required").select2('data'));
        tags.push(self.$("#time-estimate").select2('data'));
        tags.push(self.$("#length").select2('data'));

        if (self.$("#task-location").select2('data').id == 'true') {
          tags.push.apply(tags, self.$("#location").select2('data'));
        }

        this.tagFactory.saveNewTags(self.$("#topics").select2('data'),self.$("#skills").select2('data'),self.$("#location").select2('data'),this);
        self.trigger("afterTagEntitySave");
      });
    },

    getTagsFromPage: function () {

      // Gather tags for submission after the task is created
      tags = {
        topic: this.$("#topics").select2('data'),
        skill: this.$("#skills").select2('data'),
        location: this.$("#location").select2('data'),
        'task-skills-required': [ this.$("#skills-required").select2('data') ],
        'task-people': [ this.$("#people").select2('data') ],
        'task-time-required': [ this.$("#time-required").select2('data') ],
        'task-time-estimate': [ this.$("#time-estimate").select2('data') ],
        'task-length': [ this.$("#length").select2('data') ]
      };

      return tags;
    },

    render: function () {
      var template = _.template(TaskFormTemplate, { tags: this.tagSources })
      this.$el.html(template);
      this.initializeSelect2();
      this.initializeTextArea();

      // Important: Hide all non-currently opened sections of wizard.
      this.$("section:not(.current)").hide();

      // Return this for chaining.
      return this;
    },

    v: function (e) {
      return validate(e);
    },

    childNext: function (e, current) {
      // find all the validation elements
      var children = current.find('.validate');
      var abort = false;
      _.each(children, function (child) {
        var iAbort = validate({ currentTarget: child });
        abort = abort || iAbort;
      });
      return abort;
    },

    initializeSelect2: function () {
      var self = this;

      self.tagFactory.createTagDropDown({type:"skill",selector:"#skills"});
      self.tagFactory.createTagDropDown({type:"topic",selector:"#topics"});
      self.tagFactory.createTagDropDown({type:"location",selector:"#location"});
      
      self.$(".el-specific-location").hide();

      // ------------------------------ //
      // PRE-DEFINED SELECT MENUS BELOW //
      // ------------------------------ //
      self.$("#skills-required").select2({
        placeholder: "Required/Not Required",
        width: 'resolve'
      });

      self.$("#time-required").select2({
        placeholder: 'Time Commitment',
        width: 'resolve'
      });

      self.$("#people").select2({
        placeholder: 'Personnel Needed',
        width: 'resolve'
      });

      self.$("#length").select2({
        placeholder: 'Deadline',
        width: 'resolve'
      });

      self.$("#time-estimate").select2({
        placeholder: 'Estimated Time Required',
        width: 'resolve'
      });

      self.$("#task-location").select2({
        placeholder: 'Work Location',
        width: 'resolve'
      });

    },

    initializeTextArea: function () {
      if (this.md) { this.md.cleanup(); }
      this.md = new MarkdownEditor({
        data: '',
        el: ".markdown-edit",
        id: 'task-description',
        placeholder: 'Description of opportunity including goals, expected outcomes and deliverables.',
        title: 'Opportunity Description',
        rows: 6,
        maxlength: 1000,
        validate: ['empty', 'count1000']
      }).render();
    },

    locationChange: function (e) {
      if (_.isEqual(e.currentTarget.value, "true")) {
        this.$(".el-specific-location").show();
      } else {
        this.$(".el-specific-location").hide();
      }
    },

    cleanup: function () {
      if (this.md) { this.md.cleanup(); }
      removeView(this);
    }

  });

  return TaskFormView;

});
