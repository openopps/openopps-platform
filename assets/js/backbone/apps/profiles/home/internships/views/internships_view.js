var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var ActivityCollection = window.c = require('../../../../../entities/activities/activities_collection');
var InternshipsActivityView = require('./internships_activity_view');

// templates
var InternshipsTemplate = require('../templates/internships_template.html');
var InternshipsAppliedTemplate = require('../templates/internships_applied_template.html');
var InternshipsSavedTemplate = require('../templates/internships_saved_template.html');
var InternshipsBadgesTemplate = require('../templates/internships_badges_template.html');

var templates = {
  main: _.template(InternshipsTemplate),
  applied: _.template(InternshipsAppliedTemplate),
  saved: _.template(InternshipsSavedTemplate),
  badges: _.template(InternshipsBadgesTemplate),
};

var InternshipsView = Backbone.View.extend({
  events: {
    'click .logout'           : 'logout',
    'click .applied-show-all' : 'showAllInternships',
    'click .saved-show-all'   : 'showAllInternships',
    'change #sort-applied'    : 'sortInternships',
    'change #sort-saved'      : 'sortInternships',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    this.$el.html(templates.main);
    $('#search-results-loading').hide();
    this.$el.localize();

    // initialize sub components
    this.initializeAppliedSaved();
    this.initializeBadges();

    this.listenTo(new ActivityCollection({ type: 'badges' }), 'activity:collection:fetch:success', function  (e) {
      var bs = e.toJSON().filter(function (b) {     
        return b.participants.length > 0;
      });
    }.bind(this));
    
    this.$el.localize();
    return this;
  },

  setTarget: function (target, inner) {
    var s = '[data-target=' + target + ']';
    $(s).html(inner);
  },

  filterArchived: function (item) { 
    return item.state != 'archived';
  },

  initializeAppliedSaved: function () {
    if (this.appliedView) { this.appliedView.cleanup(); }
    if (this.savedView) { this.savedView.cleanup(); }
    $.ajax('/api/user/activities/' + window.cache.currentUser.id).done(function (data) {
      this.data.tasks = data.tasks;
      this.appliedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-applied',
        template: templates.applied,
        target: 'task',
        handle: 'appliedInternships',  // used in css and table id
        data: _.sortBy(_.filter(data.tasks.volunteered, this.filterArchived), 'updatedAt').reverse(),
        getStatus: this.getStatus,
      });
      this.appliedView.render();

      this.savedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-saved',
        template: templates.saved,
        target: 'task',
        handle: 'savedInternships',  // used in css and in table id
        data: _.sortBy(_.filter(data.tasks.created, this.filterArchived), 'updatedAt').reverse(),
      });
      this.savedView.render();
    }.bind(this));
  },

  initializeBadges: function () {
    // _.each(['search', 'users'], function (type) {
    //   this.listenTo(new ActivityCollection({ type: type }), 'activity:collection:fetch:success', function (e) {
    //     var data = {};
    //     data[type] = e.toJSON()[0];
    //     var html = templates[type](data);
    //     this.setTarget(type, html);
    //   }.bind(this));
    // }.bind(this));
  },

  getStatus: function (task) {
    switch (task.state) {
      case 'completed':
        return (task.assigned ? (task.taskComplete ? 'Complete' : 'Not complete') : 'Not assigned');
      case 'in progress':
        return (task.assigned ? (task.taskComplete ? 'Complete' : 'Assigned') : 'Not assigned');
      case 'canceled':
        return 'Canceled';
      default:
        return (task.assigned ? 'Assigned' : 'Applied');
    }
  },

  showAllInternships: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    
    if (t.hasClass('participated-show-all')) {
      this.appliedView.options.showAll = true;
      this.appliedView.render();
    } else {
      this.savedView.options.showAll = true;
      this.savedView.render();
    }
  },

  sortInternships: function (e) {
    var target = $(e.currentTarget)[0];
    var data = this.data.tasks[target.id == 'sort-participated' ? 'applied' : 'saved'];
    var sortedData = [];
    if(target.id == 'sort-participated' && target.value == 'state') {
      sortedData = _.sortBy(_.filter(data, this.filterArchived), function (item) {
        return this.getStatus(item);
      }.bind(this));
    } else {
      sortedData = _.sortBy(_.filter(data, this.filterArchived), target.value);
    }
    if(target.value == 'title'){
      sortedData = _.sortBy(data, function (item){
        return item.title.toLowerCase();
      });     
    } 
    if(target.value == 'updatedAt') {
      sortedData = sortedData.reverse();
    }
    if(target.id == 'sort-participated') {
      this.appliedView.options.sort = target.value;
      this.appliedView.options.data = sortedData;
      this.appliedView.render();
    } else {
      this.savedView.options.sort = target.value;
      this.savedView.options.data = sortedData;
      this.savedView.render();
    }
  },

  logout: function (e) {
    if (e.preventDefault) e.preventDefault();
    window.cache.userEvents.trigger('user:logout');
  },

  cleanup: function () {
    this.$el.removeClass('home');
    removeView(this);
  },
});

module.exports = InternshipsView;
