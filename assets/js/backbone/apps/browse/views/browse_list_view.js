define([
  'jquery',
  'underscore',
  'backbone',
  'async',
  'utilities',
  'json!ui_config',
  'marked',
  'tag_config',
  'jquery_dotdotdot',
  'text!project_list_item',
  'text!task_list_item'
], function ($, _, Backbone, async, utils, UIConfig, marked, TagConfig, dotdotdot, ProjectListItem, TaskListItem) {

  var BrowseListView = Backbone.View.extend({

    initialize: function (options) {
      var self = this;

      this.options = options;
      this.data = {
        pageSize: UIConfig.browse.pageSize,
        page: 1
      }
      $(window).on('scroll',function(e){
        self.scrollCheck(e);
      });
    },

    organizeTags: function (tags) {
      // put the tags into their types
      var outTags = {};
      for (t in tags) {
        if (!(_.has(outTags, tags[t].tag.type))) {
          outTags[tags[t].tag.type] = [];
        }
        outTags[tags[t].tag.type].push(tags[t].tag);
      }
      return outTags;
    },

    scrollCheck: function(e) {
      var currentScrollPos = $(window).scrollTop();
      var currentMaxHeight = $('#container').height();
      var buffer           = 600;

      if ( (this.options.collection.length / this.data.page) > 1 && Math.ceil(this.options.collection.length / this.data.pageSize) >= this.data.page && currentScrollPos + buffer > currentMaxHeight ){
        this.data.page += 1;
        this.render();
        $(".dotactive").dotdotdot();
        $(".dotactive").removeClass("dotactive");
      }
    },

    render: function () {

      //settings for infinite scroll
      if ( UIConfig.browse.useInfiniteScroll ) {
        if ( this.data.page == 1 ){
          var start = 0;
        } else {
          var start = this.data.page * this.data.pageSize;
        }
        var limit    = start + this.data.pageSize;
      } else {
        //reset page to 1 and return
        if ( this.data.page > 1 ) {
          this.data.page = 1;
          return this;
        }
        var limit = this.options.collection.length;
        var start = 0;
      }

      for ( i = start; i < limit; i++ ){

      if ( typeof this.options.collection[i] == 'undefined' ){ break; }
        var item = {
          item: this.options.collection[i],
          user: window.cache.currentUser,
          tagConfig: TagConfig,
          tagShow: ['location', 'skill', 'topic', 'task-time-estimate', 'task-time-required']
        }
        if (this.options.collection[i].tags) {
          item.tags = this.organizeTags(this.options.collection[i].tags);
        }
        if (this.options.collection[i].description) {
          item.item.descriptionHtml = marked(this.options.collection[i].description);
        }
        var compiledTemplate = '';
        if (this.options.target == 'projects') {
          compiledTemplate = _.template(ProjectListItem, item);
        } else {
          compiledTemplate = _.template(TaskListItem, item);
        }
        this.$el.append(compiledTemplate);
      }

      return this;
    },

    cleanup: function () {
      removeView(this);
    }

  });

  return BrowseListView;
});