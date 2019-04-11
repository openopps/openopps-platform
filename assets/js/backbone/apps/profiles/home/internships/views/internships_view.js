var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');
var ModalComponent = require('../../../../../components/modal');

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
    'click .activity-link'    : 'updateApplication',
  },

  initialize: function (options) {
    this.options = options;
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
    $.ajax('/api/user/internship/activities').done(function (data) {
      this.data = data;
      this.appliedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-applied',
        template: templates.applied,
        target: 'task',
        handle: 'appliedInternships',  // used in css and table id
        data: _.sortBy(data.applications, 'cycleStartDate').reverse(),
        getStatus: this.getStatus,
        sort: 'cycleName',
      });
      this.appliedView.render();

      this.savedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-saved',
        template: templates.saved,
        target: 'task',
        handle: 'savedInternships',  // used in css and in table id
        data: _.sortBy(data.savedOpportunities, 'applyEndDate').reverse(),
        sort: 'applyEndDate',
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

  getStatus: function (application) {
    if (application.submittedAt == null) {
      return 'In Progress';
    } else {
      return 'Applied';
    }
  },

  showAllInternships: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    
    if (t.hasClass('applied-show-all')) {
      this.appliedView.options.showAll = true;
      this.appliedView.render();
    } else {
      this.savedView.options.showAll = true;
      this.savedView.render();
    }
  },

  sortInternships: function (e) {
    var target = $(e.currentTarget)[0];
    var data = this.data[target.id == 'sort-applied' ? 'applications' : 'savedOpportunities'];
    var sortedData = [];
    if(target.id == 'sort-applied' && target.value == 'submittedAt') {
      sortedData = _.sortBy(_.filter(data, this.filterArchived), function (item) {
        return this.getStatus(item);
      }.bind(this));
    } else {
      sortedData = _.sortBy(_.filter(data, this.filterArchived), target.value);
    }
    if(target.value == 'communityName'){
      sortedData = _.sortBy(data, function (item){
        return item.communityName.toLowerCase();
      });     
    }
    if(target.value == 'taskLocation'){
      sortedData = _.sortBy(data, function (item){
        return item.taskLocation.toLowerCase();
      });     
    }
    if(target.value == 'title'){
      sortedData = _.sortBy(data, function (item){
        return item.title.toLowerCase();
      });     
    }
    if(target.value == 'updatedAt' || target.value == 'applyEndDate') {
      sortedData = sortedData.reverse();
    }
    if(target.id == 'sort-applied') {
      this.appliedView.options.sort = target.value;
      this.appliedView.options.data = sortedData;
      this.appliedView.render();
    } else {
      this.savedView.options.sort = target.value;
      this.savedView.options.data = sortedData;
      this.savedView.render();
    }
  },

  updateApplication: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    var dataAttr = $(e.currentTarget).attr('data-id');
   
    var data= _.filter(this.data.applications,function (app){
      return app.id == dataAttr; })[0];
  
    if (data.submittedAt == null) {
      Backbone.history.navigate('apply/' + data.id, { trigger: true });
    } else {
      Backbone.history.navigate('application/' + data.id, { trigger: true });
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
