// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');

// internal dependencies
var UIConfig = require('../../../../config/ui.json');
var TagShowView = require('../../../tag/show/views/tag_show_view');
var Login = require('../../../../config/login.json');
var TagFactory = require('../../../../components/tag_factory');
var ProfilePhotoView = require('./profile_photo_view');
var HomeActivityView = require('../../home/views/home_activity_view');
var InternshipsActivityView = require('../../home/internships/views/internships_activity_view');

// templates
var ProfileShowTemplate = require('../templates/profile_show_template.html');
var ShareTemplate = require('../templates/profile_share_template.txt');
var CreatedTemplate = require('../../home/templates/home_created_template.html');
var ParticipatedTemplate = require('../../home/templates/home_participated_template.html');
var AppliedTemplate = require('../../home/internships/templates/internships_applied_template.html');
var SavedTemplate = require('../../home/internships/templates/internships_saved_template.html');

var ProfileShowView = Backbone.View.extend({
  events: {
    'change .validate'              : 'validateField',
    'blur .validate'                : 'validateField',
    'click .link-backbone'          : linkBackbone,
    'change .form-control'          : 'fieldModified',
    'blur .form-control'            : 'fieldModified',
    'click .participated-show-all'  : 'showAllParticipated',
    'click .created-show-all'       : 'showAllParticipated',
    'change #sort-participated'     : 'sortTasks',
    'change #sort-created'          : 'sortTasks',
    'click .applied-show-all'       : 'showAllInternships',
    'click .saved-show-all'         : 'showAllInternships',
    'change #sort-applied'          : 'sortInternships',
    'change #sort-saved'            : 'sortInternships',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];

    this.initializeAction();
    this.initializeErrorHandling();
  },

  initializeAction: function () {
    var model = this.model.toJSON();
    var currentUser = window.cache.currentUser || {};
    if (this.options.action === 'edit') {
      this.edit = true;
      if (model.id !== currentUser.id && !model.canEditProfile) {
        this.edit = false;
        Backbone.history.navigate('profile/' + model.id, {
          trigger: false,
          replace: true,
        });
      }
    } else if (this.options.action === 'skills') {
      this.skills = true;
      if (model.id !== currentUser.id && !model.canEditProfile) {
        this.skills = false;
        Backbone.history.navigate('profile/' + model.id, {
          trigger: false,
          replace: true,
        });
      }
    }
  },

  initializeErrorHandling: function () {
    // Handle server side errors
    this.model.on('error', function (model, xhr) {
      var error = xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            $('#' + item + '-update-alert-message').html(message);
            $('#' + item + '-update-alert').show();
          }
        }
      } else if (error) {
        var alertText = xhr.statusText + '. Please try again.';
        $('.alert.alert-danger').text(alertText).show();
        $(window).animate({ scrollTop: 0 }, 500);
      }
    }.bind(this));
  },

  getTags: function (types) {
    var allTags = this.model.attributes.tags;
    var result = _.filter(allTags, function (tag) {
      return _.contains(types, tag.type);
    });
    return result;
  },

  render: function () {
    var data = {
      login: Login,
      data: this.model.toJSON(),
      tags: this.getTags(['skill', 'topic']),
      skillsTags: this.getTags(['skill']),
      interestsTags: this.getTags(['topic']),
      tagTypes: this.tagTypes,
      user: window.cache.currentUser || {},
      edit: false,
      skills: false,
      saved: this.saved,
      ui: UIConfig,
    };

  
    data.dos = data.data.communities && data.data.communities.student? _.findWhere(data.data.communities.student, { referenceId: 'dos' }):'';
    

    data.internFilename = 'intern' + (data.data.internshipsCompleted <= 3 ? data.data.internshipsCompleted : 3);
    data.loginGovEmail = data.data.username;
    data.fedEmail = data.data.governmentUri;
    data.career = this.getTags(['career'])[0];

    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }

    var template = _.template(ProfileShowTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();

    // initialize sub components
    this.initializeTags();
    this.initializePhoto();
    this.shareProfileEmail();
    if (data.user.id !== data.data.id) {
      if (data.data.hiringPath != 'student') {
        this.renderOpportunities(data.data.id);
      } else {
        this.renderInternshipOpportunities(data.data.id);
      }
    }

    return this;
  },

  filterCreated: function (item) {
    var user = window.cache.currentUser || {};
    if (user.isAdmin || user.isAgencyAdmin) {
      return item.state != 'archived';
    } else {
      return !_.contains(['draft', 'submitted', 'canceled', 'archived'], item.state);
    }
  },

  renderOpportunities: function (id) {
    if (this.volView) { this.volView.cleanup(); }
    if (this.taskView) { this.taskView.cleanup(); }
    $.ajax('/api/user/activities/' + id).done(function (data) {
      this.data.tasks = {
        volunteered: _.filter(data.tasks.volunteered, function (item) { return item.state != 'archived'; }),
        created: _.filter(data.tasks.created, this.filterCreated),
      };
      this.volView = new HomeActivityView({
        model: this.model,
        el: '.opportunity-participated',
        template: _.template(ParticipatedTemplate),
        target: 'task',
        handle: 'volTask',  // used in css id
        data: _.sortBy(this.data.tasks.volunteered, 'updatedAt').reverse(),
        getStatus: this.getStatus,
      });
      this.volView.render();

      this.taskView = new HomeActivityView({
        model: this.model,
        el: '.opportunity-created',
        template: _.template(CreatedTemplate),
        target: 'task',
        handle: 'task',  // used in css id
        data: _.sortBy(this.data.tasks.created, 'updatedAt').reverse(),
      });
      this.taskView.render();
    }.bind(this));
  },

  showAllParticipated: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    
    if (t.hasClass('participated-show-all')) {
      this.volView.options.showAll = true;
      this.volView.render();
    } else {
      this.taskView.options.showAll = true;
      this.taskView.render();
    }
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

  getApplicationStatus: function (application) {
    if (application.submittedAt == null) {
      if(new Date(application.applyEndDate) > new Date()) {
        return 'In progress';
      } else {
        return 'Not submitted';
      }
    } else if (application.sequence == 3) {
      if (application.taskState == 'completed') {
        if (application.internshipComplete) {
          return 'Completed';
        } else if (application.reviewProgress == 'Primary' && !application.internshipComplete) {
          return 'Not completed';
        } else if (application.reviewProgress == 'Alternate') {
          return 'Alternate';
        } else {
          return 'Not selected';
        }
      } else {
        if (application.reviewProgress == 'Primary') {
          return 'Selected';
        } else if (application.reviewProgress == 'Alternate') {
          return 'Alternate';
        } else {
          return 'Not selected';
        }
      }
    } else {
      return 'Applied';
    }
  },

  sortTasks: function (e) {
    var target = $(e.currentTarget)[0];
    var data = this.data.tasks[target.id == 'sort-participated' ? 'volunteered' : 'created'];
    var sortedData = [];
    if(target.id == 'sort-participated' && target.value == 'state') {
      sortedData = _.sortBy(data, function (item) {
        return this.getStatus(item);
      }.bind(this));
    } else {
      sortedData = _.sortBy(data, target.value);
    }
    if(target.value == 'updatedAt') {
      sortedData = sortedData.reverse();
    }
    if(target.value == 'title'){
      sortedData = _.sortBy(data, function (item){
        return item.title.toLowerCase();
      });     
    } 
    if(target.id == 'sort-participated') {
      this.volView.options.sort = target.value;
      this.volView.options.data = sortedData;
      this.volView.render();
    } else {
      this.taskView.options.sort = target.value;
      this.taskView.options.data = sortedData;
      this.taskView.render();
    }
  },

  renderInternshipOpportunities: function (id) {
    if (this.appliedView) { this.appliedView.cleanup(); }
    if (this.savedView) { this.savedView.cleanup(); }
    $.ajax('/api/user/internship/activities/' + id).done(function (data) {
      _.extend(this.data, data);
      this.appliedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-applied',
        template: _.template(AppliedTemplate),
        target: 'task',
        handle: 'appliedInternships',  // used in css and table id
        data: _.sortBy(data.applications, 'cycleStartDate').reverse(),
        getStatus: this.getApplicationStatus,
        displayOnly: true,
        sort: 'cycleName',
      });
      this.appliedView.render();

      this.savedView = new InternshipsActivityView({
        model: this.model,
        el: '.internships-saved',
        template: _.template(SavedTemplate),
        target: 'task',
        handle: 'savedInternships',  // used in css and in table id
        data: _.sortBy(data.savedOpportunities, 'applyEndDate').reverse(),
        sort: 'applyEndDate',
      });
      this.savedView.render();
    }.bind(this));
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

  initializePhoto: function () {
    if (this.photoView) { this.photoView.cleanup(); }
    this.photoView = new ProfilePhotoView({
      data: this.model,
      el: '.profile-photo',
    });
    this.photoView.render();
  },

  initializeTags: function () {
    var showTags = true;
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.edit) showTags = false;

    // this is only used for edit view now
    // TODO: refactor / rename, either reuse or simplify
    this.tagView = new TagShowView({
      model: this.model,
      el: '.tag-wrapper',
      target: 'profile',
      targetId: 'userId',
      edit: this.edit,
      skills: this.skills,
      showTags: showTags,
    });
    this.tagView.render();
  },

  shareProfileEmail: function (){
    var subject = 'Take A Look At This Profile',
        data = {
          profileTitle: this.model.get('title'),
          profileLink: window.location.protocol +
            '//' + window.location.host + '' + window.location.pathname,
          profileName: this.model.get('name'),
          profileLocation: this.model.get('location') ?
            this.model.get('location').name : '',
          profileAgency: this.model.get('agency') ?
            this.model.get('agency').name : '',
        },
        body = _.template(ShareTemplate)(data),
        link = 'mailto:?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);

    this.$('#email').attr('href', link);
  },

  cleanup: function () {
    if (this.md) { this.md.cleanup(); }
    if (this.tagView) { this.tagView.cleanup(); }
    if (this.taskView) { this.taskView.cleanup(); }
    if (this.volView) { this.volView.cleanup(); }
    removeView(this);
  },
});

module.exports = ProfileShowView;
