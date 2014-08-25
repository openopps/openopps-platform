define([
  'jquery',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'marked',
  'markdown_editor',
  'text!task_edit_form_template',
  'tag_factory'
], function ($, _, Backbone, async, utilities, marked, MarkdownEditor, TaskEditFormTemplate, TagFactory) {

  var TaskEditFormView = Backbone.View.extend({

    events: {
      'blur .validate'        : 'v',
      'click #task-view'      : 'view',
      'submit #task-edit-form': 'new_submit'
    },

    initialize: function (options) {
      this.options = options;
      this.tagFactory = new TagFactory();
      // Register listener to task update, the last step of saving
      this.listenTo(this.options.model, "task:update:success", function (data) {
        Backbone.history.navigate('tasks/' + data.attributes.id, { trigger: true });
      });
    },

    view: function (e) {
      if (e.preventDefault) e.preventDefault();
      Backbone.history.navigate('tasks/' + this.model.attributes.id, { trigger: true });
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
        tags: this.options.tags,
        madlibTags: this.options.madlibTags
      };

      compiledTemplate = _.template(TaskEditFormTemplate, this.data);
      this.$el.html(compiledTemplate);

      // DOM now exists, begin select2 init
      this.initializeSelect2();
      this.initializeTextArea();
    },

    initializeSelect2: function () {

      var formatResult = function (object, container, query) {
        var formatted = '<div class="select2-result-title">';
        formatted += object.name || object.title;
        formatted += '</div>';
        if (!_.isUndefined(object.description)) {
          formatted += '<div class="select2-result-description">' + marked(object.description) + '</div>';
        }
        return formatted;
      };

      this.$("#projectId").select2({
        placeholder: "Select a project to associate",
        multiple: false,
        formatResult: formatResult,
        formatSelection: formatResult,
        allowClear: true,
        ajax: {
          url: '/api/ac/project',
          dataType: 'json',
          data: function (term) {
            return {
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });
      if (this.data.data.project) {
        this.$("#projectId").select2('data', this.data.data.project);
      }

      this.tagFactory.createTagDropDown({type:"skill",selector:"#skills"});
      if (this.data['madlibTags'].skill) {
        this.$("#skills").select2('data', this.data['madlibTags'].skill);
      }

      this.tagFactory.createTagDropDown({type:"topic",selector:"#topics"});
      if (this.data['madlibTags'].topic) {
        this.$("#topics").select2('data', this.data['madlibTags'].topic);
      }

      this.tagFactory.createTagDropDown({type:"location",selector:"#location"});
      if (this.data['madlibTags'].location) {
        this.$("#location").select2('data', this.data['madlibTags'].location);
      }

   
      $("#skills-required").select2({
        placeholder: "required/not-required",
        width: '200px'
      });

      $("#time-required").select2({
        placeholder: 'time-required',
        width: '130px'
      });

      $("#people").select2({
        placeholder: 'people',
        width: '150px'
      });

      $("#length").select2({
        placeholder: 'length',
        width: '130px'
      });

      $("#time-estimate").select2({
        placeholder: 'time-estimate',
        width: '200px'
      });

      $("#task-location").select2({
        placeholder: 'location',
        width: '130px'
      });

    },

    initializeTextArea: function () {
      if (this.md) { this.md.cleanup(); }
      this.md = new MarkdownEditor({
        data: this.model.toJSON().description,
        el: ".markdown-edit",
        id: 'task-description',
        placeholder: 'Description of opportunity including goals, expected outcomes and deliverables.',
        title: 'Opportunity Description',
        rows: 6,
        maxlength: 1000,
        validate: ['empty', 'count1000']
      }).render();
    },

    new_submit: function (e) {

      if (e.preventDefault) e.preventDefault();
      var self = this;

      var tags = [];
      var oldTags = [];
      var diff = [];

      _.extend(this, Backbone.Events);

      // check all of the field validation before submitting
      var children = this.$el.find('.validate');
      var abort = false;
      _.each(children, function (child) {
        var iAbort = validate({ currentTarget: child });
        abort = abort || iAbort;
      });
      if (abort === true) {
        return;
      }
      
      var types = ["task-skills-required", "task-time-required", "task-people", "task-length", "task-time-estimate", "skill", "topic", "location"];
      tags = this.getTagsFromPage();
      oldTags = this.getOldTags();
      var modelData = {
        title: this.$("#task-title").val(),
        description: this.$("#task-description").val()
      };

      var projectId = this.$("#projectId").select2('data');
      if (projectId) {
        modelData.projectId = projectId.id;
      }

      this.tagFactory.saveNewTags(tags.topic,tags.skill,tags.location,this);
      diff = this.tagFactory.createDiff(oldTags, tags, types,this);

      console.log("diff dump ",diff);

      if ( diff.remove.length > 0 ) { 
        async.each(diff.remove, self.tagFactory.removeTag, function (err) {
          //console.log("delete check ", diff.remove);
        });
      }

      this.on("bjh", function (){
        oldTags = this.getOldTags();
        diff = this.tagFactory.createDiff(oldTags, tags, types,this);
        diff.add.push(this.data.lastAdded.id);
        // Add new tags
        this.addTagsToTask(diff.add, modelData, this);
      });

      self.options.model.trigger("task:update", modelData);

    },
    
    addTagsToTask: function (addTags, modelData, context) {

      async.each(addTags, context.tagFactory.addTag.bind(null,context), function (err) {
          // Update model metadata
          
      }, context);
    
      context.options.model.trigger("task:update", modelData);
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

    getOldTags: function () {

      var oldTags = [];
        for (var i in this.options.tags) {
          oldTags.push({
            id: parseInt(this.options.tags[i].id),
            tagId: parseInt(this.options.tags[i].tag.id),
            type: this.options.tags[i].tag.type
          });
        }

      return oldTags;
    },

    cleanup: function () {
      if (this.md) { this.md.cleanup(); }
      removeView(this);
    }

  });

  return TaskEditFormView;
})