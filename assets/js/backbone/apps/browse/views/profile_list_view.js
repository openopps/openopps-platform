var _ = require('underscore');
var Backbone = require('backbone');
var listTemplate = require('../templates/profile_list_template.html');

var PeopleListView = Backbone.View.extend({

  template: _.template(listTemplate),

  initialize: function(options) {
    this.el = options.el;
    this.people = options.collection;
    this.listenTo(window.cache.userEvents, "people:list", this.render);
    this.listenTo(window.cache.userEvents, "people:list:remove", this.empty);
  },

  render: function(peopleSelection) {
    // if passed a collection of people, render that collection, otherwise
    // just render the collection that you were created with (prob. everyone).
    var peopleToRender = peopleSelection ? peopleSelection : this.people;
    this.$el.html(this.template({ people: peopleToRender }));
    this.$el.localize();
  },

  empty: function() {
    this.$el.html("");
  },

  cleanup: function() {
    removeView(this);
  }

});

module.exports = PeopleListView;
