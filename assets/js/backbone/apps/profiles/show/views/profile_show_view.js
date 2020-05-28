// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var ModalComponent = require('../../../../components/modal');
var select2Custom = require('../../../../../vendor/select2-3.4.6.custom');

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
var ProfileBureauOfficeTemplate = require('../templates/profile_bureau_office_template.html');
var ProfileBureauOfficePreviewTemplate = require('../templates/profile_bureau_office_preview_template.html');
var ProfileAlertMessageTemplate = require('../templates/profile_alert_message_template.html');
var ProfileBadgePreviewTemplate = require('../templates/profile_badge_preview_template.html');
var ProfileBadgeDetailsTemplate = require('../templates/profile_badge_details_template.html');
var ProfileApplicationTemplate = require('../templates/profile_application_template.html');

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
    'click #add-bureau-office'      : 'addbureauOfficeDisplay',
    'click .remove-bureau-office'   : 'removeBureauOfficeDisplay',
    'click #add-badge'              : 'addBadges',
    'click #remove-badge'           : 'removeBadge',
    'click .applicant-select'       : 'selectApplicant',
    'click .applicant-no-select'    : 'selectApplicant',
    'click .change-selection'       : 'removeSelections',
    'click .read-more'              : 'readMore',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
    this.tagFactory = new TagFactory();
    this.data.newItemTags = [];
    this.bureaus                = [];
    this.offices                = {};
    this.dataBureauOffice   =[];
    this.currentOffices =[];
    this.userData ={};
    this.params = new URLSearchParams(window.location.search);
    this.applicant =[];
    this.task={};

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
    data.bureauOffice= data.data.bureauOffice;
    data.taskId=this.params.get('tid');
    data.volunteerId=this.params.get('vid');
      
    if (data.data.bio) {
      data.data.bioHtml = marked(data.data.bio);
    }
    if(data.taskId && data.volunteerId){
      this.getApplicantData();
      this.getTaskTagsInfo();
    
      data.applicant= this.applicant;
    }
 
    this.userData= data;  
    var template = _.template(ProfileShowTemplate)(data);
    $('#search-results-loading').hide();
    this.$el.html(template);
    this.$el.localize();
    renderSystemAlerts('profile');
    // initialize sub components
    this.initializeTags();
    this.initializePhoto();
    this.shareProfileEmail();
    this.dataBureauOffice = data.bureauOffice;
    this.renderBureauOffices();
    this.renderBadges(data);
    var detail= _.findWhere(this.task.tags, {type: 'task-time-required',name:'Detail'});
    var lateral=_.findWhere(this.task.tags, {type: 'task-time-required',name:'Lateral'});
    
    if(!_.isEmpty(detail) ||!_.isEmpty(lateral)){
      $('#bureau-office-sect').hide();
      this.renderApplicantSection();
    }
   
    if (data.user.id !== data.data.id) {
      if (data.data.hiringPath != 'student') {
        this.renderOpportunities(data.data.id);
      } else {
        this.renderInternshipOpportunities(data.data.id);
      }
    }

    return this;
  },

  getTaskTagsInfo: function () {
    var taskId = this.params.get('tid');
    $.ajax({
      url: '/api/task/' + taskId ,
      type: 'GET',
      async: false,
      success: function (data) {
        this.task = data;    
      }.bind(this),
    });
  },

  getDocumentAccess: function (callback) {
    var taskId = this.params.get('tid');
    var volunteerId= this.params.get('vid');    
    $.ajax({
      url: '/api/volunteer/'+ volunteerId +'/resume'+'?' + $.param({
        taskId:taskId,
      }),  
      type: 'GET',
      async: false,
      success: function (data) {
        callback(data);
      }.bind(this),
      error: function () {
        showWhoopsPage();
      },
    });
  },

  filterCreated: function (item) {
    var user = window.cache.currentUser || {};
    if (user.isAdmin || user.isAgencyAdmin) {
      return item.state != 'archived';
    } else {
      return !_.contains(['draft', 'submitted', 'canceled', 'archived'], item.state);
    }
  },
  
  renderBadges: function (data){
    var badgesPreviewTemplate = _.template(ProfileBadgePreviewTemplate)(data);   
    $('#profile_badge_preview').html(badgesPreviewTemplate);
  },

  renderApplicantSection:function (){ 
    this.data = {
      statementOfInterestHtml: marked(this.applicant[0].statementOfInterest),
      resumeType: this.applicant[0].resumeType,
    };
    if (this.applicant[0].resumeType == 'builder') {
      this.getDocumentAccess(function (documentAccess) {
        this.getBuilderResume(documentAccess, function (error, data) {
          if (error) {
            showWhoopsPage();
          } else {
            _.extend(this.data, data);
            var profileApplicationTemplate = _.template(ProfileApplicationTemplate)(this.data);   
            $('#applicant-detail-lateral').html(profileApplicationTemplate);
          }
        }.bind(this));
      }.bind(this));
    } else {
      var profileApplicationTemplate = _.template(ProfileApplicationTemplate)(this.data);   
      $('#applicant-detail-lateral').html(profileApplicationTemplate);
    }
  },

  getBuilderResume: function (documentAccess, callback) {
    $.ajax({
      url: documentAccess.url,
      method: 'GET',
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + documentAccess.key);
      },
      success: function (data) {
        callback(false, data);
      },
      error: function () {
        callback(true);
      },
    });
  },
  
  readMore: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    
    if (t.hasClass('statement-of-interest')) {
      $('.statement-of-interest').removeClass('read-less');
      $('a.statement-of-interest.read-more').hide();
      $('div.statement-of-interest').addClass('show');
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
        return (task.selected ? (task.taskComplete ? 'Complete' : 'Not complete') : 'Not assigned');
      case 'in progress':
        return (task.selected ? (task.taskComplete ? 'Complete' : 'Assigned') : 'Not assigned');
      case 'canceled':
        return 'Canceled';
      default:
        return (task.selected ? 'Assigned' : 'Applied');
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
          return 'Primary Select';
        } else if (application.reviewProgress == 'Alternate') {
          return 'Alternate Select';
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

  initializeBureaus: function () {
    $.ajax({
      url: '/api/enumerations/bureaus', 
      type: 'GET',
      async: false,
      success: function (data) {
        for (var i = 0; i < data.length; i++) {
          this.offices[data[i].bureauId] = data[i].offices ? data[i].offices : [];
        }
        this.bureaus = data.sort(function (a, b) {
          if(a.name < b.name ) { return -1; }
          if(a.name > b.name ) { return 1; }
          return 0;
        });
      }.bind(this),
    });
  },

  saveBureauOffice: function (data,self) { 
    if(!this.checkBureauOfficeExist(data,self) && !this.validateBureau() && !this.validateOffice()){
      $.ajax({
        url: '/api/user/bureau-office/' + data.userId, 
        type: 'POST',
        data:data,   
        success: function (data) {        
          this.dataBureauOffice=data.bureauOffice;
          self.modalComponent.cleanup();
          window.cache.currentUser.bureauOffice= this.dataBureauOffice;
          this.renderBureauOffices();
          this.renderAlertMessages(data,self);
        }.bind(this),
      });
    }
    else{   
      if(this.validateBureau() && this.validateOffice()){
        $('.usa-input-error').get(0).scrollIntoView();
      }
      if(this.checkBureauOfficeExist(data,self)){
        self.modalComponent.cleanup();
      }     
    }
  },
    
  showOfficeDropdown: function () {
    if($('#profile_tag_bureau').select2('data')) {
      $('#profile_tag_office').select2('data', null);
      var selectData = $('#profile_tag_bureau').select2('data');
      this.currentOffices = this.offices[selectData.id];
      if (this.currentOffices.length) {
        $('.profile_tag_office').show();
        $('#profile_tag_office').removeAttr('disabled', true);     
      } else {
        $('#profile_tag_office').select2('data', null);        
     
      }
    } else {
      $('.profile_tag_office').hide();  
      $('#profile_tag_office').select2('data', null);  
    }
  },

  initializeSelect2: function () {
    $('#profile_tag_bureau').select2({
      placeholder: 'Select a bureau',
      width: '100%',
      allowClear: true,
    });
   
    $('#profile_tag_office').select2({
      placeholder: 'Select an office',
      width: '100%',
      allowClear: true,
      data: function () { 
        return {results: this.currentOffices}; 
      }.bind(this),
    });
    $('#profile_tag_bureau').on('change', function (e) {    
      this.showOfficeDropdown();   
    }.bind(this));
  },

  renderAlertMessages: function (data,self) {   
    var alertMessageTemplate = _.template(ProfileAlertMessageTemplate)({   
      insertSuccess:data.insertSuccess,
      insertBadgeSuccess:data.insertBadgeSuccess,  
      bureau:data.bureau,
      office:data.office,
      user: data.user,
      removeSuccess :data.removeSuccess,
      removeBadgeSuccess:data.removeBadgeSuccess,
      username: this.userData.data.name,
    });
   
    $('#alert-message').html(alertMessageTemplate);
    window.scrollTo(0, 0);
  },

  addbureauOfficeDisplay:function (event){ 
    event.preventDefault && event.preventDefault(); 
    var self = this;
    self.initializeBureaus();
    self.initializeSelect2();
    if (this.modalComponent) { this.modalComponent.cleanup(); } 
    var data = { 
      bureaus: self.bureaus,    
    };  
  
    var modalContent = _.template(ProfileBureauOfficeTemplate)(data);  
    self.modalComponent = new ModalComponent({         
      el: '#site-modal',
      id: 'add-bureau-office',
      modalTitle: 'Bureau and Office/post',
      modalBody: modalContent,        
      secondary: {
        text: 'Cancel',
        action: function () {          
          self.modalComponent.cleanup();    
        }.bind(this),
      },
      primary: {
        text: 'Save',
        action: function (){
          var data={
            bureauId : $('#profile_tag_bureau').select2('data')? $('#profile_tag_bureau').select2('data').id : null,
            officeId : $('#profile_tag_office').select2('data') ? $('#profile_tag_office').select2('data').id : null,
            userId: $(event.currentTarget ).data('userid'),
          };        
          self.saveBureauOffice(data,self);
        },
      },      
    }).render();  
     
    $('#profile_tag_bureau').on('change', function (e) {
      self.showOfficeDropdown();      
    }.bind(this));

    self.initializeSelect2();
    $('.validateBureau').on('blur', function (e) {
      self.validateBureau();
    }.bind(this));

    $('.validateBureau').on('change', function (e) {
      self.validateBureau();
    }.bind(this));

    $('.validateOffice').on('change', function (e) {
      self.validateOffice();
    }.bind(this));

    $('.validateOffice').on('blur', function (e) {
      self.validateOffice();
    }.bind(this));
    
    //adding this to show select2 data in modal
    $('.select2-drop, .select2-drop-mask').css('z-index', '99999');
  },

  validateBureau : function (){
    var abort= false;
     
    if($('#profile_tag_bureau').select2('data') ==null){
      $('#profile_valid_bureau').addClass('usa-input-error');     
      $('#profile_valid_bureau>.field-validation-error').show();
      abort=true;
    }
   
    else{
      $('#profile_valid_bureau').removeClass('usa-input-error');     
      $('#profile_valid_bureau>.field-validation-error').hide();
   
      abort= false;
    }
    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    return abort;
  },

  validateOffice : function (){
    var abort= false;
    var selectData= $('#profile_tag_bureau').select2('data');
    var selectOfficeData= $('#profile_tag_office').select2('data');
    if(selectData != null){
      $('#profile_valid_bureau').removeClass('usa-input-error');     
      $('#profile_valid_bureau>.field-validation-error').hide();
      abort= false;
      this.currentOffices = this.offices[selectData.id];
      if (this.currentOffices.length && selectOfficeData ==null) {   
        $('#profile_valid_office').addClass('usa-input-error');     
        $('#profile_valid_office>.field-validation-error').show();
        abort= true;
      } 
      else{
        $('#profile_valid_office').removeClass('usa-input-error');     
        $('#profile_valid_office>.field-validation-error').hide();
        abort= false;
      }
    }
    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }
    return abort;
  },

  checkBureauOfficeExist : function (data,self){
    var exist = _.findIndex(this.dataBureauOffice, { bureau_id : data.bureauId,office_id: data.officeId});
    if(exist == -1){
      return false;
    }
    else{
      return true;
    }
  },

  removeBureauOfficeDisplay:function (event){ 
    event.preventDefault && event.preventDefault(); 
    var self = this;
    
    if (this.modalComponent) { this.modalComponent.cleanup(); }    
    var bureauName=$(event.currentTarget ).data('bureau-name');
    var officeName=$(event.currentTarget ).data('office-name');
  
    self.modalComponent = new ModalComponent({         
      el: '#site-modal',
      id: 'remove-bureau-office',
      alert: 'error',  
      action: 'delete',   
      modalTitle: 'Confirm remove bureau and office/post',
      modalBody:  'Are you sure you want to remove ' + window.cache.currentUser.name + ' from the <strong>' + bureauName + (officeName?'/':'') + officeName + '</strong>?',        
      secondary: {
        text: 'Cancel',
        action: function () {          
          self.modalComponent.cleanup();    
        }.bind(this),
      },
      primary: {
        text: 'Remove',
        action: function (){
          var data={
            userBureauOfficeId : $(event.currentTarget ).data('user-bureau-office-id'),      
            userId: $(event.currentTarget ).data('user-id'),
            bureau: $(event.currentTarget ).data('bureau-name'),
            office: $(event.currentTarget ).data('office-name'),
          };        
          self.deleteBureauOffice(data,self);
        },
      },      
    }).render();   
  },

  deleteBureauOffice : function (userBureauOfficeData,self){
    $.ajax({
      url: '/api/user/bureau-office/' + userBureauOfficeData.userId +'?' + $.param({
        userBureauOfficeId: userBureauOfficeData.userBureauOfficeId,
      }), 
      type: 'DELETE',       
      success: function (data) {     
        userBureauOfficeData.removeSuccess= true;      
        this.dataBureauOffice=_.reject(this.dataBureauOffice,function (d){
          return d.userBureauOfficeId== userBureauOfficeData.userBureauOfficeId;
        });
        window.cache.currentUser.bureauOffice = this.dataBureauOffice;     
        self.modalComponent.cleanup();
        this.renderBureauOffices();
        this.renderAlertMessages(userBureauOfficeData,self);
      }.bind(this),
    });
  },

  renderBureauOffices: function () {
    var bureauOfficeTemplate = _.template(ProfileBureauOfficePreviewTemplate)({
      data: this.dataBureauOffice,     
    }); 
    $('#bureau-office-preview').html(bureauOfficeTemplate);
  }, 

  addBadges: function (event){
    event.preventDefault && event.preventDefault(); 
    var self = this;
  
    if (this.modalComponent) { this.modalComponent.cleanup(); }   
    var modalContent = _.template(ProfileBadgeDetailsTemplate)(this.userData);  
    self.modalComponent = new ModalComponent({         
      el: '#site-modal',
      id: 'add-badge',
      modalTitle: 'Add badge',
      modalBody: modalContent,        
      secondary: {
        text: 'Cancel',
        action: function () {          
          self.modalComponent.cleanup();    
        }.bind(this),
      },
      primary: {
        text: 'Add',
        action: function (){
          var data={
            type :$('#badge-name').val(),                 
          };        
          self.saveBadge(data,self);
        },
      },      
    }).render();        
  },

  saveBadge: function (data,self) { 
    if(!this.checkBadgeExist()){ 
      $.ajax({
        url: '/api/user/badge/' + this.userData.data.id, 
        type: 'POST',
        data:data,   
        success: function (data) {
          this.userData.data.badges.push(data);            
          self.modalComponent.cleanup();
          this.renderBadges(this.userData);
          this.renderAlertMessages(data,self);    
        }.bind(this),
      });
    }
    else{
      self.modalComponent.cleanup();
    }
  },

  removeBadge:function (event){ 
    event.preventDefault && event.preventDefault(); 
    var self = this;
    
    if (this.modalComponent) { this.modalComponent.cleanup(); }    
   
    self.modalComponent = new ModalComponent({         
      el: '#site-modal',
      id: 'remove-badge',
      alert: 'error',  
      action: 'delete',   
      modalTitle: 'Remove badge',
      modalBody:  'Are you sure you want to remove the <strong>Community Manager </strong> badge from ' + this.userData.data.name + '\'s profile? ',       
      secondary: {
        text: 'Cancel',
        action: function () {          
          self.modalComponent.cleanup();    
        }.bind(this),
      },
      primary: {
        text: 'Remove',
        action: function (){
          var badgeData = {         
            userId: $(event.currentTarget ).data('user-id'),
            type: $(event.currentTarget ).data('badge-type'), 
            badgeId : $(event.currentTarget ).data('badge-id'),    
          };        
          self.deleteBadge(badgeData,self);
        },
      },      
    }).render();   
  },

  deleteBadge : function (badgeData,self){  
    $.ajax({
      url: '/api/user/badge/' + badgeData.userId +'?' + $.param({
        type: badgeData.type,
      }), 
      type: 'DELETE',       
      success: function (data) {     
        badgeData.removeBadgeSuccess= true;      
        this.userData.data.badges=_.reject(this.userData.data.badges,function (d){
          return d.id== badgeData.badgeId;
        });
        
        self.modalComponent.cleanup();
        this.renderBadges(this.userData);  
        this.renderAlertMessages(badgeData,self);  
      }.bind(this),
    });
    
  },
  checkBadgeExist : function (data,self){
    var exist = _.findIndex(this.userData.data.badges, { type:'community manager'});
    if(exist == -1){
      return false;
    }
    else{
      return true;
    }
  },

  removeSelections : function (e){
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    var taskId= this.params.get('tid');
    var volunteerId= this.params.get('vid');  
    $.ajax({
      url: '/api/volunteer/select/remove',
      type: 'PUT',
      data: {
        taskId: taskId,
        volunteerId: volunteerId,
        select: null,
      },
      success: function (data) {       
        Backbone.history.navigate('profile/'+ data.assignedVolunteer.userId+'?vid='+data.id+'&tid='+data.taskId, { trigger: true });  
        Backbone.history.loadUrl(Backbone.history.getFragment()); 
      }.bind(this),
      error: function (err) {
     
      }.bind(this),
    });
  },
  selectApplicant: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    var select = $(e.currentTarget).data('behavior') == 'select';
   
    var taskId= this.params.get('tid');
    var volunteerId= this.params.get('vid');  
    var selectDisabled = $('#applicant-select').hasClass('disabled'); 
    var notSelectDisabled=$('#applicant-no-select').hasClass('disabled'); 
   
    if((select && !selectDisabled) ||(!select && !notSelectDisabled)){
      $.ajax({
        url: '/api/volunteer/select',
        type: 'POST',
        data: {
          taskId: taskId,
          volunteerId: volunteerId,
          select: select,
        },
        success: function (data) { 
         
          if(data.selected=='true') {  
            Backbone.history.navigate('/tasks/' + data.taskId + '?saveSelected&selectedName='+data.assignedVolunteer.name, { trigger: true }); 
          }
          else{
            Backbone.history.navigate('/tasks/' + data.taskId + '?saveNotSelected&selectedName='+data.assignedVolunteer.name, { trigger: true }); 
          }      
        }.bind(this),
        error: function (err) {
       
        }.bind(this),
      });
    }
  },

  getApplicantData : function (){
    var taskId= this.params.get('tid');
    var volunteerId= this.params.get('vid');  
    $.ajax({
      url: '/api/user/applicants/' + volunteerId +'?' + $.param({
        taskId:taskId,
      }),  
      type: 'GET',
      async: false,
      success: function (data) {
        this.applicant = data;     
      }.bind(this),
    });
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
