define([
  'jquery',
  'jquery_select2',
  'underscore',
  'backbone',
  'i18n',
  'utilities',
  'json!ui_config',
  'popovers',
  'tag_config',
  'browse_list_view',
  'text!browse_main_template',
  'text!browse_search_tag'
], function ($, select2, _, Backbone, i18n, utils, UIConfig,
            Popovers, TagConfig,
            BrowseListView, BrowseMainTemplate, BrowseSearchTag) {

  var popovers = new Popovers();

  var BrowseMainView = Backbone.View.extend({

    events: {
      "submit #search-form"             : "search",
      "click .search-tag-remove"        : "searchTagRemove",
      "click .search-clear"             : "searchClear",
      "change .stateFilter"             : "searchTagRemove",
      "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
      "click      .project-people-div"  : popovers.popoverClick,
      "keyup .select2-container"        : "submitOnEnter"
    },

    initialize: function (options) {
      this.options = options;
    },

    render: function () {
      var options = {
        target: this.options.target,
        user: window.cache.currentUser,
        ui: UIConfig
      };
      this.compiledTemplate = _.template(BrowseMainTemplate, options)
      this.$el.html(this.compiledTemplate);
      this.$el.i18n();

      this.initializeSearch();

      // Allow chaining.
      return this;
    },

    format: function (self, object, container, query) {
      var name = object.name || object.title;
      var icon = this.tagIcon[object.type];
      if (object.target == 'project') {
        icon = 'fa fa-folder-o';
      } else if (object.target == 'task') {
        icon = 'fa fa-tag';
      }
      return '<i class="' + icon + '"></i> <span class="box-icon-text">' + name + '</span>';
    },

    initializeSearch: function() {
      var self = this;
      this.searchTerms = [];
      this.tags = [];

      // figure out which tags apply
      for (var i = 0; i < TagConfig[this.options.target].length; i++) {
        this.tags.push(TagConfig.tags[TagConfig[this.options.target][i]]);
      }

      // extract tag icons and classes
      this.tagIcon = {};
      this.tagClass = {};
      for (var i = 0; i < this.tags.length; i++) {
        this.tagIcon[this.tags[i].type] = this.tags[i].icon;
        this.tagClass[this.tags[i].type] = this.tags[i]['class'];
      }

      var formatResult = function (object, container, query) {
        return self.format(self, object, container, query);
      };

      // Initialize Select2
      $("#search").select2({
        placeholder: 'I\'m looking for...',
        multiple: true,
        formatResult: formatResult,
        formatSelection: function(object,container,query) {
            //null object.target to remove the task / project icons that get readded when terms go
            //     to the search box on the right
            object.target = null;
            object.type   = object.name || object.title;
            object.id     = object.name || object.title;
            object.value  = object.name || object.title;
            object.unmatched = true;
            return object.name || object.title;
        },
        createSearchChoice: function (term) {
            return { unmatched: true,id: term, value: term, name: "<b>"+term+"</b> <i>click to text search for this value.</i>" };
        },
        ajax: {
          url: '/api/ac/search/' + self.options.target,
          dataType: 'json',
          data: function (term) {
            return {
              type: TagConfig[self.options.target].join(),
              q: term
            };
          },
          results: function (data) {
            return { results: data };
          }
        }
      }).on("select2-selecting", function (e){
          if ( e.choice.hasOwnProperty("unmatched") && e.choice.unmatched ){
            //remove the hint before adding it to the list
            e.choice.name = e.val;
          }
        });
    },

    submitOnEnter: function (e) {
      if(e.keyCode === 13) {
        this.search(e);
      }
    },

    search: function (e) {
      var self = this;
      if (e.preventDefault) e.preventDefault();

      // get values from select2
      var data = $("#search").select2("data");
      if (data.length > 0) {
        $("#search-none").hide();
        $(".search-clear").show();
      }

    _.each(data, function (d) {
        var found = false;
        // check if this search term already is chosen
        for (var i in self.searchTerms) {
          if (self.searchTerms[i].id == d.id) {
            if (self.searchTerms[i].title && (self.searchTerms[i].title == d.title)) {
              found = true;
            }
            else if (self.searchTerms[i].name && (self.searchTerms[i].name == d.name)) {
              found = true;
            }
          }
        }
        // return if the search term is found
        if (found) return;
        // add it to our list of search terms
        self.searchTerms.push(d);
        // render the search term in the list
        var templData = {
          data: d,
          format: self.format(self, d)
        };
        var templ = _.template(BrowseSearchTag, templData);
        if (d.target == 'tagentity') {
          $("#search-tags").append(templ);
        } else {
          $("#search-projs").append(templ);
        }
    });

      $("#search").select2("data","");
      self.searchPrep(self.searchTerms,e);
    },

    renderList: function (collection) {
      // create a new view for the returned data
      if (this.browseListView) { this.browseListView.cleanup(); }

      this.checkForDrafts();

      this.browseListView = new BrowseListView({
        el: '#browse-list',
        target: this.options.target,
        collection: collection,
      });

      // Show draft filter
      var draft = _(collection).chain()
            .pluck('state')
            .indexOf('draft').value() >= 0;
      //$(".draft-filter").toggleClass('hidden', !draft);
      if ( draft ) {
        $("[name='stateDraft']").prop("checked",true);
      }
      $("#browse-search-spinner").hide();
      $("#browse-list").show();
      this.browseListView.render();
      popovers.popoverPeopleInit(".project-people-div");
    },

    checkForDrafts: function () {
      var self = this;

      $.ajax({
        url: '/api/search',
        type: 'POST',
        data: JSON.stringify({
          state: ['draft'],
          freeText: [],
          items: [],
          tags: [],
          target: self.options.target,
          user: (window.cache.currentUser || {}).id
        }),
        dataType: 'json',
        contentType: 'application/json'
      }).done(function (data) {
          if ( data.length > 0 ) {
            $(".draft-filter").toggleClass('hidden', false);
          }
      });

    },

    searchPrep: function (terms,e) {

      // create a search object
      var data = {
        items: [],
        tags: [],
        state: [],
        freeText: [],
        target: this.options.target,
        user: (window.cache.currentUser || {}).id
      };
      _.each(terms, function (t) {
        if ( t.unmatched ) {
          data.freeText.push(t.value);
        } else {
          data.items.push(t.id);
        }
      });

    _.each($(".stateFilter:checked"),function(test){ data.state.push(test.value)});

      this.searchExec(data);
    },

    searchExec: function (data) {

      var self = this;

      $.ajax({
        url: '/api/search',
        type: 'POST',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json'
      }).done(function (data) {
          // render the search results
          self.renderList(data);
      });
    },

    searchTagRemove: function (e) {
      if (e.preventDefault) e.preventDefault();

      var self = this;

      if ( $(e.currentTarget).hasClass("stateFilter") ){
        if ( $("#search-tags").length > 0 ) {
          var parent = $("#search-tags");
          var id = "search-tags";
          var project = false;
        }
      } else {
        var parent = $(e.currentTarget).parents('li')[0];
        var id = $(parent).data('id');
        var type = $($(e.currentTarget).parents('ul')[0]).attr('id');
        var project = false;

        if (type == 'search-projs') {
          project = true;
        }
      }

    for (i in self.searchTerms) {
        if (self.searchTerms[i].id == id) {
          if (project && self.searchTerms[i].title) {
            self.searchTerms.splice(i, 1);
            break;
          } else if (self.searchTerms[i].name) {
            self.searchTerms.splice(i, 1);
            break;
          }
        }
      }

      if ( !$(e.currentTarget).hasClass("stateFilter") ){
        parent.remove();
      }
      if (self.searchTerms.length == 0) {
        $("#search-none").show();
        $(".search-clear").hide();
      }
      self.searchPrep(self.searchTerms,e);
    },

    searchClear: function (e) {
      if (e.preventDefault) e.preventDefault();
      this.searchTerms = [];
      $("#search-projs").children().remove();
      $("#search-tags").children().remove();
      $("#search-none").show();
      $(".search-clear").hide();
      this.searchPrep(self.searchTerms,e);
    },

    cleanup: function() {
      if (this.browseListView) { this.browseListView.cleanup(); }
      removeView(this);
    }

  });

  return BrowseMainView;
});
