define([
  'jquery',
  'bootstrap',
  'underscore',
  'backbone',
  'utilities',
  'async',
  'modal_component',
  'tag_config',
  'tag_form_view',
  'text!tag_item_template',
  'text!tag_show_template',
  'tag_factory'
], function ($, Bootstrap, _, Backbone, utils, async, ModalComponent,
  TagConfig, TagFormView, TagTemplate, TagShowTemplate,TagFactory) {

  var TagShowView = Backbone.View.extend({

    events: {
      "click #tag-create"     : "createTag",
      "click #tag-save"       : "saveTag",
      "click .tag-delete"     : "deleteTag"
    },

    initialize: function (options) {
      this.options = options;
      this.model = options.model;
      this.target = options.target;
      this.targetId = options.targetId;
      this.edit = options.edit;
      this.tagFactory = new TagFactory();
      this.tags = [];
      // Figure out which tags apply
      for (var i = 0; i < TagConfig[this.target].length; i++) {
        this.tags.push(TagConfig.tags[TagConfig[this.target][i]]);
      }
    },

    render: function () {
      var data = {
        data: this.model.toJSON(),
        tags: this.tags,
        edit: this.edit,
        user: window.cache.currentUser || {}
      };
      var template = _.template(TagShowTemplate, data);
      this.$el.html(template);
      this.initializeSelect2();
      this.initializeTags();
      return this;
    },

    initializeSelect2: function () {
      var self = this;

      self.tagFactory.createTagDropDown({
        type:"skill",selector:"#tag_skill",width: "100%",tokenSeparators: [","]
      });

      self.tagFactory.createTagDropDown({
        type:"topic",selector:"#tag_topic",width: "100%",tokenSeparators: [","]
      });

      self.tagFactory.createTagDropDown({type:"location",selector:"#tag_location",width: "100%"});
      self.tagFactory.createTagDropDown({type:"agency",selector:"#tag_agency",width: "100%"});
      self.model.trigger("profile:input:changed");
    },

    initializeTags: function() {
      // Load tags for the view
      var self = this;

      var tagIcon = {};
      var tagClass = {};
      for (var i = 0; i < this.tags.length; i++) {
        tagIcon[this.tags[i].type] = this.tags[i].icon;
        tagClass[this.tags[i].type] = this.tags[i]['class'];
      }

      var renderTag = function (tag) {
        var templData = {
          data: self.model.toJSON(),
          tags: self.tags,
          tag: tag,
          edit: self.edit,
          user: window.cache.currentUser || {}
        };
        var compiledTemplate = _.template(TagTemplate, templData);
        var tagDom = $("." + tag.tag.type).children(".tags");
        tagDom.append(compiledTemplate);
        $('#' + tagClass[tag.tag.type] + '-empty').hide();
      };

      $.ajax({
        url: this.options.url + this.model.id
      }).done(function (data) {
        for (var i = 0; i < data.length; i++) {
          // Render tags onto page
          renderTag(data[i]);
        }
      });

      // Initialize Select2 for Administrative Functions
      var formatResult = function (object, container, query) {
        return '<i class="' + tagIcon[object.type] + '"></i> ' + object.name;
      };

      $("#input-tags").select2({
        placeholder: 'Add tags',
        multiple: true,
        formatResult: formatResult,
        formatSelection: formatResult,
        ajax: {
          url: '/api/ac/tag',
          dataType: 'json',
          data: function (term) {
            return {
              type: TagConfig[self.target].join(),
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      });

      // New tags added in to the DB via the modal
      this.listenTo(this.model, this.target + ":tag:new", function (data) {
        // Destory modal
        $(".modal").modal('hide');
        // Add tag into the data list
        var s2data = $("#input-tags").select2("data");
        s2data.push(data);
        $("#input-tags").select2("data", s2data);
      });

      // Tags saved using the select2 dialog
      this.listenTo(this.model, this.target + ":tag:save", function (data) {
        for (var i = 0; i < data.length; i++) {
          if (!data[i].existing) {
            renderTag(data[i]);
          }
        }
        $("#input-tags").select2("val", "");
      });

      this.listenTo(this.model, this.target + ":tag:delete", function (e) {
        if ($(e.currentTarget).parent('li').siblings().length == 1) {
          $(e.currentTarget).parent('li').siblings('.tag-empty').show();
        }
        $(e.currentTarget).parent('li').remove();
      });
    },

    createTag: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;

      // Pop up dialog box to create tag,
      // then put tag into the select box
      if (_.isUndefined(this.modalComponent)) {
        this.modalComponent = new ModalComponent({
          el: "#container",
          id: "createTag",
          modalTitle: "Create Tag"
        }).render();
      }

      if (!_.isUndefined(this.modalComponent)) {
        if (this.tagFormView) {
          this.tagFormView.cleanup();
        }
        this.tagFormView = new TagFormView({
          el: "#createTag .modal-template",
          model: self.model,
          tags: self.tags,
          target: self.target
        });
        this.tagFormView.render();
      }
    },

    saveTag: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;
      // Cycle through tags in select box
      // and call create on each one, then
      // render
      $("#tag-save").addClass('disabled');
      var data = $("#input-tags").select2('data');
      var result = [];

      var processTag = function(tag, done) {
        var tagMap = {
          tagId: tag.id
        };
        if (self.targetId) {
          tagMap[self.targetId] = self.model.id;
        }
        $.ajax({
          url: '/api/tag',
          type: 'POST',
          data: tagMap
        }).done(function (data) {
          result.push(data);
          done();
        });
      };

      async.each(data, processTag, function (err) {
        for (var i = 0; i < result.length; i++) {
          for (var j = 0; j < data.length; j++) {
            if (result[i].tagId == data[j].id) {
              result[i].tag = data[j];
              break;
            }
          }
        }
        $("#tag-save").removeClass('disabled');
        self.model.trigger(self.options.target + ":tag:save", result);
      });

    },

    deleteTag: function (e) {
      if (e.preventDefault) e.preventDefault();
      var self = this;
      // Get the data-id of the currentTarget
      // and then call HTTP DELETE on that tag id
      $.ajax({
        url: '/api/tag/' + $(e.currentTarget).data('id'),
        type: 'DELETE',
      }).done(function (data) {
        self.model.trigger(self.options.target + ":tag:delete", e);
      });
    },

    cleanup: function () {
      if (this.tagFormView) { this.tagFormView.cleanup(); }
      removeView(this);
    }

  });

  return TagShowView;

});
