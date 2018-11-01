var _ = require('underscore');
var Backbone = require('backbone');
var ProfileListTemplate = require('../templates/profile_list_template.html');
var ProfileListTable = require('../templates/profile_list_table.html');

var PeopleListView = Backbone.View.extend({
  events: {
    'keyup #search': 'search',
  },

  initialize: function (options) {
    this.el = options.el;
    this.collection = options.collection;
  },

  render: function () {
    $('#search-results-loading').show();
    //var peopleToRender = this.collection.chain().pluck('attributes').value();
    var template = _.template(ProfileListTemplate)({});
    this.$el.html(template);
    this.$el.localize();
    this.fetchData();
  },

  fetchData: function () {
    var self = this;
    self.collection.fetch({
      success: function (collection) {
        var peopleToRender = collection.chain().pluck('attributes').value();
        var template = _.template(ProfileListTable)({ people: peopleToRender });
        // self.$('.loading-container').hide();
        self.$('.table-responsive').html(template);
        $('#search-results-loading').hide();
      },
    });
  },

  search: function (event) {
    var target = this.$(event.currentTarget);
    var term = target.val();
    items = this.collection.chain()
      .pluck('attributes')
      .filter( _.bind( filterPeople, this, term ) )
      .value();
    var template = _.template(ProfileListTable)({ people: items });
    self.$('.table-responsive').html(template);
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

function filterPeople ( term, person ) {
  var name = person.name ? person.name.toLowerCase() : '';
  var title = person.title ? person.title.toLowerCase() : '';
  var location = person.location ? person.location.name.toLowerCase() : '';
  var agency = person.agency ? person.agency.name.toLowerCase() : '';
  var abbreviation = person.agency && person.agency.abbr ? person.agency.abbr.toLowerCase() : '';
  return (name.indexOf(term.toLowerCase()) > -1) ||
    (title.indexOf(term.toLowerCase()) > -1) ||
    (location.indexOf(term.toLowerCase()) > -1) ||
    (agency.indexOf(term.toLowerCase()) > -1) ||
    (abbreviation.indexOf(term.toLowerCase()) > -1);
}

module.exports = PeopleListView;
