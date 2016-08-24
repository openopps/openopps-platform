//TODO: var select2 = require('Select2');
var fs = require('fs');
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');


var UIConfig = require('../../../config/ui.json');
var Popovers = require('../../../mixins/popovers');
var TagConfig = require('../../../config/tag');
var BrowseListView = require('./browse_list_view');
var ProfileListView = require('./profile_list_view');
var ProfileMapView = require('./profile_map_view');
var BrowseMainTemplate = fs.readFileSync(__dirname + ('/../templates/browse_main_view_template.html')).toString();
var BrowseSearchTag = fs.readFileSync(__dirname + ('/../templates/browse_search_tag.html')).toString();
var i18n = require('i18next');
require('jquery-i18next');

// TODO: ideally this wouldn't be global
global.popovers = new Popovers();

var BrowseMainView = Backbone.View.extend({

  events: {
    "keyup #search": 'search',
    "change #stateFilters input": 'stateFilter',
    "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
    "click      .project-people-div"  : popovers.popoverClick,
  },

  initialize: function(options) {
    this.options = options;
    this.term = options.queryParams.search;
    this.filters = options.queryParams.filters ?
      JSON.parse(options.queryParams.filters) :
      options.target === 'profiles' ? {} : { state: 'open' };
    window.foo = this;
  },

  render: function() {
    var target = this.options.target,
      options = {
        target: target,
        user: window.cache.currentUser,
        ui: UIConfig,
        placeholder: target === 'tasks' ?
          "I'm looking for opportunities by name, " + i18n.t("tag.agency") + ", skill, topic, description..." : target === 'projects' ?
          "I'm looking for working groups by name, " + i18n.t("tag.agency") + ", skill, topic, description..." : target === 'profiles' ?
          "I'm looking for people by name, title,  " + i18n.t("tag.agency") + ", location..." : "I'm looking for..."
      };
    this.rendered = _.template(BrowseMainTemplate)(options);
    this.$el.html(this.rendered);
    this.$el.localize();

    $('#search').val(this.term);

    _.each(_.isArray(this.filters.state) ?
      this.filters.state : [this.filters.state],
      function(state) {
        $('#stateFilters [value="' + state + '"]').prop('checked', true);
      });

    // Allow chaining.
    return this;
  },

  search: function(event) {
    var $target = this.$(event.currentTarget);
    this.filter($target.val());
  },

  stateFilter: function(event) {
    var states = _($('#stateFilters input:checked')).pluck('value');
    this.filter(undefined, { state: states });
  },

  filter: function(term, filters) {
    var items;

    if (typeof term !== 'undefined') this.term = term;
    if (typeof filters !== 'undefined') this.filters = filters;
    term = this.term;
    filters = this.filters;

    items = this.collection.chain().pluck('attributes').filter(function(item) {
      // filter out tasks that are full time details with other agencies
      var userAgency = { id: false },
        timeRequiredTag = _.where(item.tags, { type: 'task-time-required' })[0],
        fullTimeTag = false;

      if (window.cache.currentUser) {
        userAgency = _.where(window.cache.currentUser.tags, { type: 'agency' })[0];
      }

      if (timeRequiredTag && timeRequiredTag.name === 'Full Time Detail') {
        fullTimeTag = true;
      }

      if (!fullTimeTag) return item;
      if (fullTimeTag && userAgency && (timeRequiredTag.data.agency.id === userAgency.id)) return item;
    }).filter(function(data) {
      var searchBody = JSON.stringify(_.values(data)).toLowerCase();
      return !term || searchBody.indexOf(term.toLowerCase()) >= 0;
    }).filter(function(data) {
      var test = [];
      _.each(filters, function(value, key) {
        if (_.isArray(value)) {
          test.push(_.some(value, function(val) {
            return data[key] === val || _.contains(data[key], value);
          }));
        } else {
          test.push(data[key] === value || _.contains(data[key], value));
        }
      });
      return test.length === _.compact(test).length;
    }).value();

    this.renderList(items);
    if (this.options.target === 'profiles') this.renderMap(items);
  },


  searchMap: function(loc) {
    loc = !loc ? '' : loc === this.term ? '' : loc;
    $('#search').val(loc);
    this.filter(loc);
  },

  renderList: function(collection) {

    // create a new view for the returned data
    if (this.browseListView) { this.browseListView.cleanup(); }

    if (this.options.target == 'projects' || this.options.target == 'tasks') {
      // projects and tasks get tiles
      $("#browse-map").hide();
      this.browseListView = new BrowseListView({
        el: '#browse-list',
        target: this.options.target,
        collection: collection
      });
      // Show draft filter
      var draft = _(collection).chain()
        .pluck('state')
        .indexOf('draft').value() >= 0;
      $(".draft-filter").toggleClass('hidden', !draft);

    } else {
      // profiles are in a table
      this.browseListView = new ProfileListView({
        el: '#browse-list',
        target: this.options.target,
        collection: collection
      });
    }
    $("#browse-search-spinner").hide();
    $("#browse-list").show();
    this.browseListView.render();

    popovers.popoverPeopleInit(".project-people-div");
  },

  renderMap: function(profiles) {
    // create a new view for the returned data. Need to show the div before
    // rendering otherwise the SVG borders will be wrong.
    if (this.browseMapView) { this.browseMapView.cleanup(); }
    $("#browse-map").show();
    this.browseMapView = new ProfileMapView({
      el: '#browse-map',
      people: profiles
    });
    this.browseMapView.render();
    // set up listeners for events from the map view
    this.listenTo(this.browseMapView, "browseSearchLocation", this.searchMap);
    this.listenTo(this.browseMapView, "browseRemove", this.searchRemove);
  },

  cleanup: function() {
    if (this.browseMapView) { this.browseMapView.cleanup(); }
    if (this.browseListView) { this.browseListView.cleanup(); }
    removeView(this);
  }

});

module.exports = BrowseMainView;
