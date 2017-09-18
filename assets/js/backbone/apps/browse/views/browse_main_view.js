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
    'change #js-restrict-task-filter input': 'agencyFilter',
    "mouseenter .project-people-div"  : popovers.popoverPeopleOn,
    "click      .project-people-div"  : popovers.popoverClick,
  },

  initialize: function(options) {
    this.options = options;
    this.term = options.queryParams.search;
    this.filters = options.queryParams.filters ?
      JSON.parse(options.queryParams.filters) :
      options.target === 'profiles' ? {} : { state: 'open' };

    this.userAgency = window.cache.currentUser ? window.cache.currentUser.agency : {};
    this.initAgencyFilter();

    window.foo = this;
  },

  isAgencyChecked: function() {
    return !!$( '#js-restrict-task-filter input:checked' ).length;
  },

  initAgencyFilter: function() {
    this.agency = { data: {} };
    if (this.options.queryParams.agency) {
      // TODO: ideally we would be able to query the API for agencies
      // and look up the name via the abbreviation. This is basically
      // a hack to determine whether the current user's agency matches
      // the abbreviation passed in the query string.
      this.agency.data.abbr = this.options.queryParams.agency;
      if (this.userAgency.name &&
          this.userAgency.name.indexOf('(' + this.agency.data.abbr + ')') >= 0) {
        this.agency.data.name = this.userAgency.name;
      } else {
        this.agency.data.name = this.agency.data.abbr;
      }
      this.filter( undefined, undefined, this.agency );
    } else if (this.isAgencyChecked()) {
      this.agency.data = this.userAgency;
    }
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
          "I'm looking for people by name, title,  " + i18n.t("tag.agency") + ", location..." : "I'm looking for...",
        agencyName: (!(_.isEmpty(this.agency.data)) ? this.agency.data.name : this.userAgency.name)
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

    $('#js-restrict-task-filter [name="restrict"]').prop('checked', !(_.isEmpty(this.agency.data)));

    // Allow chaining.
    return this;
  },

  search: function(event) {
    var $target = this.$(event.currentTarget);
    this.filter($target.val());
  },

  stateFilter: function(event) {
    var states = _($('#stateFilters input:checked')).pluck('value');
    if ( this.isAgencyChecked() ) {
      this.filter( undefined, { state: states }, this.agency );
    } else {
      this.filter(undefined, { state: states }, { data: {} });
    }
  },

  agencyFilter: function ( event ) {
    var isChecked = event.target.checked;
    var states = _( $( '#stateFilters input:checked' ) ).pluck( 'value' );
    this.initAgencyFilter();
    if ( isChecked ) {
      this.filter( undefined, { state: states }, this.agency );
    } else {
      this.stateFilter();
    }
  },

  filter: function (term, filters, agency) {
    var items;

    if (typeof term !== 'undefined') this.term = term;
    if (typeof filters !== 'undefined') this.filters = filters;
    if (typeof agency !== 'undefined') this.agency = agency;
    term = this.term;
    filters = this.filters;
    agency = this.agency;
    /**
     * TODO: There are three separate filters happening here on the same dataset.
     * There should not be three separate filters. The following code is used throughout
     * the application so modify it at your own risk.
     */
    items = this.collection.chain()
      .pluck('attributes')
      .filter( _.bind( filterTaskByAgency, this, agency ) )
      .filter( _.bind( filterTaskByTerm, this, term ) )
      .filter( _.bind( filterTaskByFilter, this, filters ) )
      .value();

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
    return;
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


function filterTaskByAgency ( agency, task ) {
  var getAbbr = _.property( 'abbr' );

  if ( _.isEmpty( agency.data ) ) {
    return task;
  }

  if ( getAbbr( agency.data ) === getAbbr( task.restrict ) ) {
    return _.property( 'restrictToAgency' )( task.restrict ) || _.property( 'projectNetwork' )( task.restrict );
  }

}

function filterTaskByTerm ( term, task ) {
  var searchBody = JSON.stringify( _.values( task ) ).toLowerCase();
  return ( ! term ) || ( searchBody.indexOf( term.toLowerCase() ) >= 0 );
}

function filterTaskByFilter ( filters, task ) {
  var test = [];
  _.each( filters, function ( value, key ) {
    if ( _.isArray( value ) ) {
      test.push( _.some( value, function ( val ) {
        return task[ key ] === val || _.contains( task[ key ], value );
      } ) );
    } else {
      test.push( task[ key ] === value || _.contains( task[ key ], value ) );
    }
  } );
  return test.length === _.compact(test).length;
}

module.exports = BrowseMainView;
