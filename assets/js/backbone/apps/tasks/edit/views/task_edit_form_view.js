define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'json!ui_config',
  'async',
  'marked',
  'markdown_editor',
  'text!task_edit_form_template',
  'tag_factory'
], function ($, _, Backbone, utilities, UIConfig, async, marked, MarkdownEditor, TaskEditFormTemplate, TagFactory) {

  var TaskEditFormView = Backbone.View.extend({

    events: {
      'blur .validate'        : 'v',
      'click #task-view'      : 'view',
      'submit #task-edit-form': 'submit'
    },

    initialize: function (options) {
      this.options = options;
      this.tagFactory = new TagFactory();
      this.data = {};
      this.data.newTag = {};
      this.initializeListeners();
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
        newItemTags: [],
        tags: this.options.tags,
        madlibTags: this.options.madlibTags,
        ui: UIConfig
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

      this.tagFactory.createTagDropDown({
        type:"skill",selector:"#skills",tokenSeparators: [","]
      });
      if (this.data['madlibTags'].skill) {
        this.$("#skills").select2('data', this.data['madlibTags'].skill);
      }

      this.tagFactory.createTagDropDown({
        type:"topic",selector:"#topics",tokenSeparators: [","]
      });
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
        validate: ['empty']
      }).render();
    },

    initializeListeners: function() {
      var self = this;

      self.on("task:tags:save:done", function (){

        var modelData = {
          title: this.$("#task-title").val(),
          description: this.$("#task-description").val()
        };

        var projectId = this.$("#projectId").select2('data');
        if (projectId) {
          modelData.projectId = projectId.id;
        }

        oldTags = this.getOldTags();
        tags    = this.getTagsFromPage();
        diff    = this.tagFactory.createDiff(oldTags, tags);

        _.each(self.data.newItemTags, function(newItemTag){
          diff.add.push(newItemTag.id);
        });

        async.forEach(
          diff.add,
          function(diffAdd, callback){
            if ( !_.isFinite(diffAdd) && diffAdd.name == diffAdd.id ) { return callback(); }
            self.tagFactory.addTag(diffAdd,self.model.attributes.id,"taskId",callback);
          },
          function(err){
            self.options.model.trigger("task:update", modelData);
          }
        );

      });
    },

    submit: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();
      //var self = this;

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

      //var types = ["task-skills-required", "task-time-required", "task-people", "task-length", "task-time-estimate", "skill", "topic", "location"];
      tags = this.getTagsFromPage();
      oldTags = this.getOldTags();

      newTags = [];
      newTags = newTags.concat(self.$("#topics").select2('data'),self.$("#skills").select2('data'),self.$("#location").select2('data'));

        async.forEach(
          newTags,
          function(newTag, callback) {
            self.tagFactory.addTagEntities(newTag,self,callback);
          },
          function(err) {
          if (err) return next(err);
            self.trigger("task:tags:save:done");
          }
        );
      diff = this.tagFactory.createDiff(oldTags, tags);

      if ( diff.remove.length > 0 ) {
        async.each(diff.remove, self.tagFactory.removeTag, function (err) {
          // do nothing for now
        });
      }
    },

    getTagsFromPage: function () {

      // Gather tags for submission after the task is created
      var tags = [];
      tags.push.apply(tags,this.$("#topics").select2('data'));
      tags.push.apply(tags,this.$("#skills").select2('data'));
      tags.push.apply(tags,this.$("#location").select2('data'));
      tags.push.apply(tags,[this.$("#skills-required").select2('data')]);
      tags.push.apply(tags,[this.$("#people").select2('data')]);
      tags.push.apply(tags,[this.$("#time-required").select2('data')]);
      tags.push.apply(tags,[this.$("#time-estimate").select2('data')]);
      tags.push.apply(tags,[this.$("#length").select2('data')]);

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
