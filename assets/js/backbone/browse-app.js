var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var NavView = require('./apps/nav/views/nav_view');
var FooterView = require('./apps/footer/views/footer_view');
var ProfileHomeController = require('./apps/profiles/home/controllers/home_controller');
var ProfileShowController = require('./apps/profiles/show/controllers/profile_show_controller');
var ProfileEditController = require('./apps/profiles/edit/controllers/profile_edit_controller');
var ProfileResetController = require('./apps/profiles/reset/controllers/profile_reset_controller');
var ProfileListController = require('./apps/profiles/list/controllers/profile_list_controller');
var StudentHomeController = require('./apps/profiles/home/internships/controllers/internships_controller');
var TaskModel = require('./entities/tasks/task_model');
var TaskSearchController = require('./apps/tasks/search/controllers/task_search_controller');
var TaskShowController = require('./apps/tasks/show/controllers/task_show_controller');
var TaskEditFormView = require('./apps/tasks/edit/views/task_edit_form_view');
var TaskAudienceFormView = require('./apps/tasks/edit/views/task_audience_form_view');
var TaskApplyView  = require('./apps/tasks/show/views/task_apply_view');
var InternshipEditFormView = require('./apps/internships/edit/views/internship_edit_form_view');
var InternshipView = require('./apps/internships/show/views/internship_view');
var AdminMainController = require('./apps/admin/controllers/admin_main_controller');
var AdminCommunityEditView=require('./apps/admin/views/admin_community_edit_view');
var AdminCommunityApplicantSubmittedView= require('./apps/admin/views/admin_community_applicant_submitted_view');
var HomeController = require('./apps/home/controllers/home_controller');
var ApplyController = require('./apps/apply/controllers/apply_controller');
var ApplyCongratulationsView = require('./apps/apply/views/apply_congratulations_view');
var LoginController = require('./apps/login/controllers/login_controller');
var WelcomeView = require('./apps/welcome/views/welcome_view');
var Modal = require('./components/modal');

var BrowseRouter = Backbone.Router.extend({

  routes: {
    ''                                              : 'showLanding',
    'home'                                          : 'showHome',
    'tasks/create'                                  : 'createTask',
    'admin/community/create'                        : 'createCommunity',
    'tasks/new(?*queryString)'                      : 'newTask',
    'tasks(/)(?:queryStr)'                          : 'searchTasks',
    'search(/:action)(/)(?:queryStr)'               : 'searchTasks',
    'community(/:vanity)(/)'                        : 'lookUpVanityURL',
    //'tasks/:id(/)'                                  : 'showTask',
    'tasks/:id(/:action)(/)(?:queryStr)'            : 'showTask',
    'internships/new'                               : 'newInternship',
    'internships/:id(/)(:action)(/)'                : 'showInternship',
    'profiles(/)(?:queryStr)'                       : 'listProfiles',
    'profile/:id(/)'                                : 'showProfile',
    'profile/edit/skills/:id(/)'                    : 'editSkills',
    'profile/edit/bureau_office/:id(/)'             : 'editBureauOffice',
    'profile/edit/:id(/)'                           : 'editProfile',
    'profile/:action/:key'                          : 'resetProfile',
    'admin(/)'                                      : 'showAdmin',
    'admin(/):action(/)(:actionId)(/)(:subAction)'  : 'showAdmin',
    'login(/)'                                      : 'showLogin',
    'apply/congratulations'                         : 'showApplyCongratulations',
    'apply/:id(/)'                                  : 'showApply',
    'application/:id(/)'                            : 'showApply',
    'apply/task/:id(/)'                             : 'showTaskApply',
    'applicant/submitted'                           : 'showApplicantSubmittedInternships',
    'ineligible_citizenship'                        : 'showIneligibleCitizenship',
    'welcome(/)'                                    : 'showWelcome',
    'expired(/)'                                    : 'showExpired',
    'logout'                                        : 'logout',
    'loggedOut'                                     : 'showLogout',
    'whoops'                                        : 'showWhoops',
    '*notFound'                                     : 'notFound',
   
  },

  data: { saved: false },

  initialize: function () {

    this.navView = new NavView({
      el: '.navigation',
    }).render();

    this.footerView = new FooterView({
      el: '#footer',
    }).render();

    // set navigation state
    this.on('route', function (route, params) {
      var href = window.location.pathname;
      $('.navigation .nav-link')
        .closest('li')
        .removeClass('active');
      $('.navigation .nav-link[href="' + href + '"]')
        .closest('li')
        .addClass('active');
      $.getJSON('/csrfToken', function (t) {
        window.cache.userEvents.trigger('idle:reset');
        $('meta[name="csrf-token"]').attr('content', t._csrf);
        $.ajaxPrefilter(function (options, originalOptions, jqXHR) {
          var token;
          token = $('meta[name="csrf-token"]').attr('content');
          if (token) {
            return jqXHR.setRequestHeader('X-CSRF-Token', token);
          }
        });
      });
    });
  },

  cleanupChildren: function () {
    if (this.browseListController) { this.browseListController.cleanup(); }
    if (this.profileShowController) { this.profileShowController.cleanup(); }
    if (this.profileEditController) { this.profileEditController.cleanup(); }
    this.profileListController && this.profileListController.cleanup();
    if (this.taskShowController) { this.taskShowController.cleanup(); }
    if (this.taskSearchController) { this.taskSearchController.cleanup(); }
    if (this.taskCreateController) { this.taskCreateController.cleanup(); }
    if (this.taskEditFormView) { this.taskEditFormView.cleanup(); }
    if (this.taskAudienceFormView) { this.taskAudienceFormView.cleanup(); }
    if (this.homeController) { this.homeController.cleanup(); }
    if (this.loginController) { this.loginController.cleanup(); }
    if (this.internshipEditFormView) { this.internshipEditFormView.cleanup(); }
    if (this.internshipView) { this.internshipView.cleanup(); }   
    this.applyController && this.applyController.cleanup();
    if (this.adminCommunityEditView) { this.adminCommunityEditView.cleanup(); }
    if (this.adminCommunityApplicantSubmittedView) { this.adminCommunityApplicantSubmittedView.cleanup(); }  
    if (this.taskApplyView) { this.taskApplyView.cleanup(); }  
    this.applyCongratulationsView && this.applyCongratulationsView.cleanup();
    this.studentHomeController && this.studentHomeController.cleanup();
    this.welcomeView && this.welcomeView.cleanup();
    this.adminMainController && this.adminMainController.cleanup();
    this.data = { saved: false };
  },

  showLanding: function () {
    this.cleanupChildren();
    this.homeController = new HomeController({
      target: 'home',
      el: '#container',
      router: this,
      data: this.data,
    });
  },

  showLogin: function () {
    if(loginGov) {
      window.location = '/api/auth/oidc' + location.search + escape(location.hash);     
    } else {
      this.cleanupChildren();
      this.loginController = new LoginController({
        target: 'login',
        el: '#container',
        router: this,
        data: this.data,
      });
    }
  },

  showWelcome: function () {
    try {
      var user = JSON.parse(atob(new URLSearchParams(window.location.search).get('u')));
    // eslint-disable-next-line no-empty
    } catch (err) { }
    if (user) {
      Backbone.history.navigate('/welcome', { replace: true, trigger: false });
      this.navView = new NavView({
        el: '.navigation',
        welcome: true,
        name: user.givenName, 
      }).render();
      this.welcomeView = new WelcomeView({
        target: 'home',
        el: '#container',
        router: this,
        user: user,
      }).render();
    } else {
      Backbone.history.navigate('/', { replace: true, trigger: true });
    }
  },

  showIneligibleCitizenship: function () {
    var IneligibleCitizenship = require('./apps/apply/templates/apply_ineligible_citizenship_template.html');
    var IneligibleCitizenshipTemplate = _.template(IneligibleCitizenship)(this.data);
    $('#container').html(_.template(IneligibleCitizenshipTemplate)());
    var ProcessFlowTemplate = require('./apps/apply/templates/process_flow_template.html');
    $('#process-title-banners').html(_.template(ProcessFlowTemplate)({ currentStep: 0, selectedStep: 0 }));
    $('#search-results-loading').hide();
  },

  logout: function () {
    $.ajax({
      url: '/api/auth/logout?json=true',
    }).done(function (data) {
      if(data.redirectURL) {
        window.location = data.redirectURL;
      } else {
        this.showLogout();
      }
    }.bind(this)).fail(function () {
      this.showLogout();
    }.bind(this)).always(function () {
      window.cache.currentUser = null;
    });
  },

  showLogout: function () {
    $.ajax({
      url: '/api/auth/clearSession?json=true',
    }).done(function (data) {
      this.navView = new NavView({
        el: '.navigation',
        accessForbidden: true, 
      }).render();
      var LogOutTemplate = require('./apps/login/templates/logout.html');
      $('#container').html(_.template(LogOutTemplate)());
      $('#search-results-loading').hide();
      $('.usa-footer-return-to-top').hide();
    }.bind(this)).fail(function () {
      showWhoopsPage();
    });
  },

  showWhoops: function () {
    Backbone.history.navigate('/', { replace: true });
    showWhoopsPage();
  },

  notFound: function () {
    showNotFoundPage();
  },

  showExpired: function () {
    Backbone.history.navigate('/', { replace: true });
    this.navView = new NavView({
      el: '.navigation', 
    }).render();
    var ExpiredTemplate = require('./apps/login/templates/expired.html');
    $('#container').html(_.template(ExpiredTemplate)());
    $('#search-results-loading').hide();
    $('.usa-footer-return-to-top').hide();
  },

  parseQueryParams: function (str) {
    var params = {};
    if (str) {
      var terms = str.split('&');
      for (var i = 0; i < terms.length; i++) {
        var nameValue = terms[i].split('=');
        if (nameValue.length == 2) {
          if (nameValue[0] in params) {
            if (!_.isArray(params[nameValue[0]])) {
              params[nameValue[0]] = [params[nameValue[0]]];
            }
            params[nameValue[0]].push(nameValue[1]);
          } else {
            params[nameValue[0]] = nameValue[1];
          }
        } else {
          params[terms[i]] = '';
        }
      }
    }
    return params;
  },

  searchTasks: function (action, queryStr) {
    this.navView && this.navView.render();
    this.cleanupChildren();
    this.taskSearchController = new TaskSearchController({
      el: '#container',
      router: this,
      action: action,
      queryParams: this.parseQueryParams(queryStr),
      data: this.data,
    });
  },

  lookUpVanityURL: function (vanity) {
    $.ajax({
      url: '/api/vanity/' + vanity,
      type: 'GET',
      success: function (data) {
        if(data) {
          Backbone.history.navigate('/search?community=' + data.community_id, { trigger: true, replace: true });
        } else {
          this.notFound();
        }
      }.bind(this),
    });
  },

  listProfiles: function (queryStr) {
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?profiles', { trigger: true });
    } else if (window.cache.currentUser.hiringPath != 'fed' && window.cache.currentUser.hiringPath != 'contractor') {
      Backbone.history.navigate('/home', { trigger: true, replace: true });
    } else {
      this.cleanupChildren();
      this.profileListController = new ProfileListController({
        el: '#container',
        router: this,
        queryParams: this.parseQueryParams(queryStr),
        data: this.data,
      });
    }
  },

  showTask: function (id, action, queryStr) {
    this.navView && this.navView.render();
    $('#search-results-loading').show();
    this.cleanupChildren();
    var model = new TaskModel();
    this.listenTo(model, 'task:model:fetch:success', function (model) {   
      model.loadCommunity(model.get('communityId'), function (community) {
        if (!_.isEmpty(community) && community.targetAudience == 'Students') {
          Backbone.history.navigate('/internships/' + id + (action ? '/' + action : '') + (queryStr ? '?' + queryStr : ''), { replace: true });
          if (action && action == 'edit') {
            this.renderInternshipEdit(model, community);
          } else {
            this.renderInternshipView(model, community, queryStr);
          }
        } else {
          if (window.cache.currentUser && (window.cache.currentUser.hiringPath != 'fed' && window.cache.currentUser.hiringPath != 'contractor')) {
            Backbone.history.navigate('/home', { trigger: true, replace: true });
          } else {
            this.taskShowController = new TaskShowController({
              model: model,
              community: community,
              router: this,
              id: id,
              action: action,
              data: this.data,
            });
          }
        }
      }.bind(this));
    }.bind(this));
    model.trigger('task:model:fetch', id);
  },

  showInternship: function (id, action, queryStr) {
    this.navView && this.navView.render();
    $('#search-results-loading').show();
    this.cleanupChildren();
    var model = new TaskModel();   
    this.listenTo(model, 'task:model:fetch:success', function (model) {
      model.loadCommunity(model.get('communityId'), function (community) {
        if (_.isEmpty(community) || community.targetAudience !== 'Students') {
          Backbone.history.navigate('/tasks/' + id + (action ? '/' + action : '') + (queryStr ? '?' + queryStr : ''), { replace: true });
          this.taskShowController = new TaskShowController({
            model: model,
            community: community,
            router: this,
            id: id,
            action: action,
            data: this.data,
          });
        } else {
          $.ajax({
            url: '/api/lookup/languageProficiencies',
          }).done(function (languageProficiencies) {
            if (action && action == 'edit') {
              this.renderInternshipEdit(model,community,languageProficiencies);
            } else {
              this.renderInternshipView(model,community,languageProficiencies);
            }
          }.bind(this)).fail(function () {
            // throw error;
          });
        }
      }.bind(this));
    }.bind(this));
    model.trigger('task:model:fetch', id);
  },

  createTask: function () {
    if (window.cache.currentUser && _.isEmpty(window.cache.currentUser.agency)) {
      $('body').addClass('modal-is-open');
      this.modal = new Modal({
        el: '#site-modal',
        id: 'create-opp',
        modalTitle: 'Please complete your profile.',
        modalBody: 'You have not selected your agency on the federal service page of your USAJOBS profile.',
        primary: {
          text: loginGov ? 'Update profile at USAJOBS.gov' : 'Go to profile',
          action: function () {
            this.modal.cleanup();
            window.location = usajobsURL + '/Applicant/Profile/';
          }.bind(this),
        },           
        secondary: {
          text: 'Cancel',
          action: function () {
            Backbone.history.navigate('/search');
            this.modal.cleanup();
          }.bind(this),
        },
      }).render();
    } else {
      this.navView && this.navView.render();
      this.cleanupChildren();
      this.taskAudienceFormView = new TaskAudienceFormView({
        el: '#container',
      }).render();
    }
  },

  createCommunity: function () {
    this.navView && this.navView.render();
    $('#search-results-loading').show();
    this.cleanupChildren();
    this.adminCommunityEditView = new AdminCommunityEditView({
      el: '#container',         
    }).render();
  },
  showApplicantSubmittedInternships: function () {
    this.navView && this.navView.render();
    $('#search-results-loading').show();
    this.cleanupChildren();
    this.adminCommunityApplicantSubmittedView = new AdminCommunityApplicantSubmittedView({
      el: '#container',         
    }).render();
  },


  /*
   * Create a new task. This method first populates and generates a new collection
   * with a single empty model. It also creates a new TaskCreationForm adding the
   * collection to it. This collection is then managed by the view using events
   * on the collection.
   */
  newTask: function (queryString) {
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?tasks/create', { trigger: true });
      return;
    }
    var params = this.parseQueryParams(queryString);
    this.cleanupChildren();
    if (params.cid) {
      this.renderViewWithCommunity(params.cid, 'Federal Employees', this.renderTaskView);
    } else {
      this.renderTaskView(this.initializeTaskModel());
    }
  },

  initializeTaskModel: function () {
    var model = new TaskModel();
    model.set('restrict', {});
    this.initializeTaskListeners(model);
    return model;
  },

  newInternship: function () {
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?internships/new', { trigger: true });
      return;
    }
    $('#search-results-loading').show();
    this.cleanupChildren();
   
    this.renderViewWithCommunity('Students', this.renderInternshipEdit);
   
  },

  renderViewWithCommunity: function ( target, view) {
    var model = this.initializeTaskModel();
    
   
    $.ajax({
      url: '/api/lookup/languageProficiencies',
    }).done(function (languageProficiencies) {  
      view.bind(this)(model,'',languageProficiencies);
    }.bind(this)).fail(function () {
      // throw error;
    });
    
  },

  renderTaskView: function (model, community) {
    var madlibTags = {};
    if(community && community.communityType && community.communityTypeValue) {
      madlibTags[community.communityType.toLowerCase()] = [community.communityTypeValue];
    }
    model.tagTypes(function (tagTypes) {
      this.taskEditFormView = new TaskEditFormView({
        el: '#container',
        edit: false,
        model: model,
        community: community,
        tags: [],
        madlibTags: madlibTags,
        tagTypes: tagTypes,
      }).render();
    }.bind(this));
  },

  renderInternshipView: function (model, community) {
    this.internshipView = new InternshipView({
      el: '#container',
      model: model,
      community: community,
      tags: [],
      madlibTags: {},
    }).render();
  },

  renderInternshipEdit: function (model,community,languageProficiencies) {
    model.tagTypes(function (tagTypes) {
      this.internshipEditFormView = new InternshipEditFormView({
        el: '#container',
        edit: false,
        model: model,
        community: community,
        languageProficiencies: languageProficiencies,    
        tags: [],
        madlibTags: {},
        tagTypes: tagTypes,
      }).render();
    }.bind(this));
  },


  initializeTaskListeners: function (model) {
    this.listenTo(model, 'task:save:success', function (data) {
      Backbone.history.navigate('/tasks/' + data.attributes.id, { trigger: true });     
      if(data.attributes.state != 'draft') {
        setTimeout(function () {
          $('body').addClass('modal-is-open');
          this.modal = new Modal({
            el: '#site-modal',
            id: 'submit-opp',
            modalTitle: 'Submitted',
            modalBody: 'Thanks for submitting <strong>' + data.attributes.title + '</strong>. We\'ll review it and let you know if it\'s approved or if we need more information.',
            primary: {
              text: 'Close',
              action: function () {
                this.modal.cleanup();
              }.bind(this),
            },           
            secondary: {
              text: 'Create another' + ' ' + (((data.attributes.community|| {}).targetAudience == 'Students') ? 'internship' : 'opportunity'),
              action: function () {
                Backbone.history.navigate('/tasks/create?target=' + ((data.attributes.community || {}).targetAudience == 'Students' ? 'students' : 'feds'), { trigger: true });
                this.modal.cleanup();
              }.bind(this),
            },
          }).render();
        }, 500);
      }
    });
   

    this.listenTo(model, 'task:save:error', function (model, response, options) {
      var error = options.xhr.responseJSON;
      if (error && error.invalidAttributes) {
        for (var item in error.invalidAttributes) {
          if (error.invalidAttributes[item]) {
            message = _(error.invalidAttributes[item]).pluck('message').join(',<br /> ');
            $('#' + item + '-update-alert').html(message).show();
          }
        }
      } else if (error) {
        var alertText = response.statusText + '. Please try again.';
        $('.alert.alert-danger').text(alertText).show();
        $(window).animate({ scrollTop: 0 }, 500);
      }
    });  
  },

  showHome: function () {
    this.navView && this.navView.render();
    this.cleanupChildren();

    if (window.cache.currentUser && window.cache.currentUser.hiringPath == 'student') {
      this.studentHomeController = new StudentHomeController({
        target: 'home',
        el: '#container',
        router: this,
        data: this.data,
      });
    } else {
      this.profileHomeController = new ProfileHomeController({
        target: 'home',
        el: '#container',
        router: this,
        data: this.data,
      });
    }
  },

  showApplyCongratulations: function () {
    this.cleanupChildren();
    this.applyCongratulationsView = new ApplyCongratulationsView({
      el: '#container',
    }).render();
  },

  showTaskApply: function (id) {
    this.cleanupChildren();
    this.taskApplyView = new TaskApplyView({
      el: '#container',
      data: { taskId: id },
    }).render();
  },

  showApply: function (id) {
    this.cleanupChildren();
    this.applyController = new ApplyController({
      target: 'apply',
      el: '#container',
      router: this,
      data: { applicationId: id },
    });
  },

  editSkills: function (id) {
    this.cleanupChildren();
    this.profileEditController = new ProfileEditController({ id: id, action: 'skills', data: this.data });
    
  },

  editBureauOffice : function (id){
    this.cleanupChildren();
    this.profileEditController = new ProfileEditController({ id: id, action: 'bureau-office', data: this.data });
  },

  editProfile: function (id) {
    this.cleanupChildren();
    this.profileEditController = new ProfileEditController({ id: id,  action: 'edit', data: this.data });
  },

  resetProfile: function (action, key) {
    this.cleanupChildren();
    this.profileResetController = new ProfileResetController({ action: action, key: key });
  },

  showProfile: function (id) {
    this.cleanupChildren();
    this.profileShowController = new ProfileShowController({ id: id, data: this.data });
  },

  showAdmin: function (action, actionId, subAction) {
    if (!window.cache.currentUser) {
      Backbone.history.navigate('/login?admin', { trigger: true });
    } else {
      this.cleanupChildren();
      var options = {
        el: '#container',
        action: action,
        subAction: subAction,
      };
      options[action + 'Id'] = actionId;
      this.adminMainController = new AdminMainController(options);
    }
  },

});

var initialize = function () {
  var router = new BrowseRouter();
  return router;
};

module.exports = {
  initialize: initialize,
};
