define([
  'jquery',
  'underscore',
  'backbone',
  'utilities',
  'text!event_list_template'
], function ($, _, Backbone, utils, EventListTemplate) {

  var EventCollectionView = Backbone.View.extend({

    events: {
      'click #event-delete'      : 'remove'
    },

    el: "#event-list-wrapper",

    initialize: function (options) {
      this.options = options;
      this.render();
    },

    render: function () {
      var eventsJSON = {
        events: this.options.collection.toJSON(),
        projectId: this.options.projectId,
        user: window.cache.currentUser
      }

      this.compiledTemplate = _.template(EventListTemplate, eventsJSON);
      this.$el.html(this.compiledTemplate);

      return this;
    },
    remove: function(e){

      this.removeEvent(e);
          
    },
    removeEvent: function (e,done) {
      var self = this;

      var id = $(e.currentTarget).data('id');
      $.ajax({
        url: '/api/event/' + id,
        type: 'DELETE',
        success: function () {
          //
        }
      });
    },
    cleanup: function () {
      removeView(this);
    }

  });

  return EventCollectionView;
});