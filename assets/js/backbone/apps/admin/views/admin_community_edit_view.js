var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var marked = require('marked');
var MarkdownEditor = require('../../../components/markdown_editor');
var ShowMarkdownMixin = require('../../../components/show_markdown_mixin');

var AdminCommunityFormTemplate = require('../templates/admin_community_form_template.html');
var AdminCommunityCustomFormTemplate = require('../templates/admin_community_custom_form_template.html');
var AdminCommunityBasicCustomFormTemplate = require('../templates/admin_community_basic_custom_form_template.html');
var AdminCommunityAddBureauOfficeTemplate = require('../templates/admin_community_add_bureau_office_template.html');
var AdminCommunityBureauAndOfficeFormTemplate = require('../templates/admin_community_bureau_and_office_form_template.html');
var AdminCommunityBureauOfficeMessageTemplate = require('../templates/add_community_bureau_office_message_template.html');
var AdminCommunityImageTemplate = require('../templates/admin_community_image_template.html');
var AdminCommunityImageBackgroundTemplate = require('../templates/admin_community_image_background_template.html');
var AdminCommunityPreviewTemplate = require('../templates/admin_community_preview_template.html');
var CommunityModel = require('../../../entities/community/community_model');
var ModalComponent = require('../../../components/modal');
var Modal = require('../../../components/modal');
var charCounter = require('../../../../vendor/jquery.charcounter');

var AdminCommunityEditView = Backbone.View.extend({

  events: {
    'click #community-edit-cancel'            : 'cancel',
    'click #community-edit-save'              : 'save',
    'blur .validate'                          : 'validateField',
    'change .validate'                        : 'validateField',
    'click #add-bureau-office'                : 'addbureauOfficeDisplay',
    'click .edit-bureau-office'               : 'addbureauOfficeDisplay',
    'click .delete-bureau'                    : 'deleteBureau',
    'click .delete-office'                    : 'deleteOffice',
    'change #display-title-color'             : 'updateColorTextField',
    'change #display-subtitle-color'          : 'updateColorTextField',
    'change #display-button-color'            : 'updateColorTextField',
    'change #display-description-color'       : 'updateColorTextField',
    'change #display-banner-color'            : 'updateColorTextField',
    'change #display-title-color-text'        : 'updateColorField',
    'change #display-subtitle-color-text'     : 'updateColorField',
    'change #display-button-color-text'       : 'updateColorField',
    'change #display-description-color-text'  : 'updateColorField',
    'change #display-banner-color-text'       : 'updateColorField',
    'click #community-preview'                : 'preview',
    'change [name=community-group]'           : 'toggleAutoJoinDisplay',
    'click #photo-remove'                     : 'removeImage',
    'click #image-remove'                     : 'removeImage',
    'change [name=background-group]'          : 'toggleBackgroundDisplay',
    'blur #usajobsSearchUrl'                  : 'validateUsajobsSearchUrlLabel',
    'change #disable-community-group'         : 'disableCommunity',
  },

  initialize: function (options) {
    _.extend(this, Backbone.Events);

    this.options = options; 
    this.departments = {};  
    this.community = new CommunityModel({
      banner: {},
    });
    this.bureaus = [];
    this.defaultTextColor = '#ffffff';
    this.defaultBannerColor = '#205493';

    this.params = new URLSearchParams(window.location.search);   
    return this;
  },
  

  render: function () {
    $('#search-results-loading').show();
    this.initializeBureaus(); 
    this.initializeAgencySelect();
    this.loadDepartments();  

    if(this.options.communityId) {
      this.loadCommunity();     
    } else {
      var data = {
        communityId: '', 
        departments : this.departments,
        displayAgencyLogo: false,
        displayCommunityname: false,
        isClosedGroup: false,
        autoJoin: false,        
      };   
        
      this.$el.html(_.template(AdminCommunityFormTemplate)(data));
      this.renderCustomize();   
      this.$el.localize();
      this.initializeFileUpload();
      this.initializeBannerFileUpload();
      this.initializeTextAreaBannerDescription();
      this.initializeCounts();
      $('#search-results-loading').hide();
      setTimeout(() => {
        this.showUsajobsSearchUrlLinkText();
      }, 50);
    }
    return this;
  },
 
  loadDepartments: function (){ 
    $.ajax({
      url: '/api/admin/community/agencies',  
      type: 'GET',
      async: false,
      success: function (data){         
        this.departments= data;       
      }.bind(this),
    });
  },

  initializeAgencySelect: function () {
    setTimeout(function () {
      $('#agencies').select2({
        placeholder: 'Select an agency',
        allowClear: true,
      });
      try {
        $('#s2id_agencies').children('.select2-choice').children('.select2-search-choice-close').remove();
      } catch (error) { /* swallow exception because close image has already been removed*/ }
    }, 50);
  },

  initializeListeners: function () {
    this.listenTo(this.community, 'community:save:success', function () {
      Backbone.history.navigate('/admin/community/' + this.options.communityId + '?updateSuccess', { trigger: true });
    }.bind(this));
    this.listenTo(this.community, 'community:save:error', function () {
      $('#community-save-error').show();
      $('#community-save-error').get(0).scrollIntoView();
    });
  },

  initializeformFields: function (community){  
    $('#communityType option:contains('+ community.communityType +')').attr('selected', true);
    $('#targetAudience option:contains('+ community.targetAudience +')').attr('selected', true);
    $('#duration option:contains('+ community.duration +')').attr('selected', true);
    $('#agencies').val(community.agency.agencyId); 
    $('input[name=display-agency-logo-group][value=' + community.displayAgencyLogo +']').prop('checked', true);
    $('input[name=display-community-name-group][value=' + community.displayCommunityName +']').prop('checked', true);
    $('input[name=community-group][value=' + community.isClosedGroup +']').prop('checked', true);
    if (!community.isClosedGroup) {
      $('#community-auto-join').hide();
    }
    $('#community-name').val(community.communityName);
    $('#description').val(community.description);
    $('#community-support-email').val(community.supportEmail);  
    $('#microsite-url').val(community.micrositeUrl);
    $('#community-mgr-name').val(community.communityManagerName);
    $('#community-mgr-email').val(community.communityManagerEmail);
    $('#community-email-signature').val(community.emailSignature);
    $('input[name=disable-community-group][value=' + community.isDisabled +']').prop('checked', true);
  },

  initializeDisplayFormFields: function (community) {
    $('#display-title').val(community.banner.title);
    $('#display-title-color-text').val(community.banner.titleColor);
    $('#display-title-color').val(community.banner.titleColor || this.defaultTextColor);
    $('#display-subtitle').val(community.banner.subtitle);
    $('#display-subtitle-color-text').val(community.banner.subtitleColor);
    $('#display-subtitle-color').val(community.banner.subtitleColor || this.defaultTextColor);
    $('#display-button-color-text').val(community.banner.buttonColor);
    $('#display-button-color').val(community.banner.buttonColor || this.defaultTextColor);
    $('input[name=button-text-group][value=' + community.banner.buttonTextColor +']').prop('checked', true);
    $('#display-description').val(community.banner.description);
    $('#display-description-color-text').val(community.banner.descriptionColor);
    $('#display-description-color').val(community.banner.descriptionColor || this.defaultTextColor);
    $('#display-banner-color-text').val(community.banner.color);
    $('#display-banner-color').val(community.banner.color || this.defaultBannerColor);
    $('input[name=background-group][value=' + community.banner.hasBackgroundImage +']').prop('checked', true);
    if (community.banner.hasBackgroundImage == 'true') {   
      $('#background-photo-banner').show();
    } else {
      $('#background-color-banner').show();
    }
    $('#vanityURL').val(community.vanityUrl);
    $('#usajobsSearchUrl').val(community.usajobsSearchUrl);
    $('#usajobsSearchUrlLabel').val(community.usajobsSearchUrlLabel);
    if (!community.usajobsSearchUrl) {
      $('#usajobsSearchUrlLinkText').hide();
    }
  },

  updateColorTextField: function (e) {
    var theInput = e.currentTarget;
    var textName = '#' + e.currentTarget.id + '-text';
    $(textName).val(theInput.value);
  },

  updateColorField: function (e) {
    var theInput = e.currentTarget;
    var colorName = '#' + e.currentTarget.id;
    colorName = colorName.replace('-text', '');
    var colorValue = (theInput.value.match(/^#[0-9A-F]{6}$/i) || [])[0];
    $(colorName).val(colorValue || (colorName == '#display-banner-color' ? this.defaultBannerColor : this.defaultTextColor));
  },

  getDataFromPage: function () {
    var modelData = {
      communityId: this.options ? this.options.communityId: null,
      communityType: $('#communityType').val(),
      targetAudience:$('#targetAudience').val(),
      duration :$('#duration').val(),
      agencyId  : $('#agencies').val(),
      displayAgencyLogo: $('#display-agency-logo-group').prop('checked'),
      displayCommunityName: $('#display-community-name-group').prop('checked'),
      isClosedGroup: $("input[name='community-group']:checked").val(),
      autoJoin: $('#community-auto-join-group').prop('checked'),
      communityName: $('#community-name').val(),
      description: $('#description').val(),
      supportEmail: $('#community-support-email').val(),     
      micrositeUrl: $('#microsite-url').val(),
      communityManagerName: $('#community-mgr-name').val(),
      communityManagerEmail: $('#community-mgr-email').val(),
      emailSignature: $('#community-email-signature').val(),
      imageId: this.community.get('imageId'),
      isDisabled: $('#disable-community-group').prop('checked'),
    };
    if (window.cache.currentUser.isAdmin) {
      modelData.banner = {
        title: $('#display-title').val(),
        titleColor: $('#display-title-color-text').val(),
        subtitle: $('#display-subtitle').val(),
        subtitleColor: $('#display-subtitle-color-text').val(),
        buttonColor: $('#display-button-color-text').val(),
        buttonTextColor: $("input[name='button-text-group']:checked").val(),
        description: $('#display-description').val(),
        descriptionColor: $('#display-description-color-text').val(),
        hasBackgroundImage: $("input[name='background-group']:checked").val(),
        backgroundImageId: this.community ? this.community.attributes.banner.backgroundImageId: null,
        color: $('#display-banner-color-text').val(),
        usajobsSearchUrl: $('#usajobsSearchUrl').val(),
        usajobsSearchUrlLabel: $('#usajobsSearchUrlLabel').val(),
      };
      modelData.vanityUrl = $('#vanityURL').val();
      modelData.usajobsSearchUrl = $('#usajobsSearchUrl').val();
      modelData.usajobsSearchUrlLabel = $('#usajobsSearchUrlLabel').val();
    } else {
      modelData.banner = _.extend(this.community.get('banner'), {
        title: $('#display-title').val(),
        subtitle: $('#display-subtitle').val(),
        description: $('#display-description').val(),
        usajobsSearchUrl: $('#usajobsSearchUrl').val(),
        usajobsSearchUrlLabel: $('#usajobsSearchUrlLabel').val(),
      });
    }
    return modelData;
  },

  loadCommunity: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.communityId,
      dataType: 'json',
      success: function (community) {      
        this.community = new CommunityModel(community);      
        community.departments = this.departments;     
        this.$el.html(_.template(AdminCommunityFormTemplate)(community));

        if(community.referenceId=='dos'){
          this.renderBureausAndOffices();
        }
        this.renderCustomize();
        this.$el.show();
        this.initializeListeners();
        this.initializeTextAreaBannerDescription();
        this.initializeCounts();
        this.initializeAgencySelect();    
        this.initializeformFields(community);
        this.renderImage(community);
        this.renderBackgroundImage(community);
        if (window.cache.currentUser.isAdmin) {
          this.initializeDisplayFormFields(community);
          this.initializeFileUpload();
          this.initializeBannerFileUpload();
        }
        $('#search-results-loading').hide();
       
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
        showWhoopsPage();
      },
    });
  },

  renderCustomize: function () {
    if (window.cache.currentUser.isAdmin) {
      var customizeTemplate = _.template(AdminCommunityCustomFormTemplate)({
        imageId: this.community ? this.community.get('imageId') : null,
        name: this.community ? this.community.get('communityName') : null,
        communityId: this.options.communityId,
        banner: this.community ? this.community.get('banner') : {},     
      });
      $('#custom-display').html(customizeTemplate);
    } else {
      var basicCustomizeTemplate = _.template(AdminCommunityBasicCustomFormTemplate)({
        banner: this.community ? this.community.get('banner') : {}, 
      });
      $('#custom-display').html(basicCustomizeTemplate);
    }
  },

  renderImage: function (data) {
    data.communityName = data.communityName || $('#community-name').val();
    var imageTemplate = _.template(AdminCommunityImageTemplate)(data);   
    $('#image-logo').html(imageTemplate);
    setTimeout(() => {
      this.initializeFileUpload();
    }, 50);
  },

  renderBackgroundImage: function (data) {
    data.communityName = data.communityName || $('#community-name').val();
    var imageBackgroundTemplate = _.template(AdminCommunityImageBackgroundTemplate)(data);   
    $('#image-background').html(imageBackgroundTemplate);
    setTimeout(() => {
      this.initializeBannerFileUpload();
    }, 50);
  },

  renderBureausAndOffices: function () {
    var bureauOfficeTemplate = _.template(AdminCommunityBureauAndOfficeFormTemplate)({
      bureaus: this.bureaus,
      communityId: this.community.communityId,     
    });
    $('#bureau-office').html(bureauOfficeTemplate);
  },
  
  renderBureausOfficesMessages: function (data,self) { 
    var bureauOfficeMessageTemplate = _.template(AdminCommunityBureauOfficeMessageTemplate)({
      updateOffice:data.updateOffice,
      updateBureau:data.updateBureau,
      name:data.name,
      insertBureau:data.insertBureau,
      insertOffice:data.insertOffice,
      deleteBureau: data.deleteBureau,
      deleteOffice: data.deleteOffice,
    });
   
    $('#bureau-office-message').html(bureauOfficeMessageTemplate);
    window.scrollTo(0, 0);
  },

  initializeCounts: function () {
    setTimeout(() => {
      [
        { id: 'community-name', count: 100 },
        { id: 'community-new-office', count: 100 },
        { id: 'community-new-bureau', count: 100 },
        { id: 'description', count: 500 },
        { id: 'display-description', count: 500 }, 
        { id: 'community-email-signature', count: 300 },
      ].forEach(function (item) {
        $('#' + item.id).charCounter(item.count, { container: '#' + item.id + '-count' });
      });
    }, 50);
  },

  initializeFileUpload: function () {
    $('#fileupload').fileupload({
      url: '/api/upload/create',
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
      formData: { 'type': 'image_square' },
      add: function (e, data) {
        $('.file-upload-progress-container').show();
        data.submit();
      }.bind(this),
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('.file-upload-progress').css('width', progress + '%');
      }.bind(this),
      done: function (e, data) {
        this.community.set('imageId', data.result.id);
        if (this.community.get('id')) {
          this.updatePhoto();
        } else {
          this.renderImage(this.community.attributes);
        }
        $('.file-upload-progress-container').hide();
        $('#file-upload-alert').hide();
      }.bind(this),
      fail: function (e, data) {
        var message = data.jqXHR.responseText || data.errorThrown;
        $('.file-upload-progress-container').hide();
        if (data.jqXHR.status == 413) {
          message = 'The uploaded file exceeds the maximum file size.';
        }
        $('#file-upload-alert-message').html(message);
        $('#file-upload-alert').show();
        window.scrollTo(0, 0);
      }.bind(this),
    });
  },

  initializeBannerFileUpload: function () {
    $('#banner-fileupload').fileupload({
      url: '/api/upload/create',
      acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
      formData: { 'type': 'image' },
      add: function (e, data) {
        $('#banner-file-upload-progress-container').show();
        data.submit();
      }.bind(this),
      progressall: function (e, data) {
        var progress = parseInt(data.loaded / data.total * 100, 10);
        $('#banner-file-upload-progress').css('width', progress + '%');
      }.bind(this),
      done: function (e, data) {
        this.community.attributes.banner.backgroundImageId = data.result.id;
        if (this.community.get('id')) {
          this.updateBackgroundImage();
        } else {
          this.renderBackgroundImage(this.community.attributes);
        }
        $('#banner-file-upload-progress-container').hide();
        $('#file-upload-alert').hide();
      }.bind(this),
      fail: function (e, data) {
        var message = data.jqXHR.responseText || data.errorThrown;
        $('#banner-file-upload-progress-container').hide();
        if (data.jqXHR.status == 413) {
          message = 'The uploaded file exceeds the maximum file size.';
        }
        $('#file-upload-alert-message').html(message);
        $('#file-upload-alert').show();
        window.scrollTo(0, 0);
      }.bind(this),
    });
  },

  updatePhoto: function () {
    var data = {
      communityId: this.community.attributes.communityId,
      imageId: this.community.attributes.imageId,
      updatedAt: this.community.attributes.updatedAt,
    };
    $.ajax({
      url: '/api/community/logo/update/' + this.community.attributes.communityId,
      type: 'POST',
      data: data, 
    }).done(function (data) {
      this.community.set('imageId', data.imageId);
      this.community.set('updatedAt', data.updatedAt);
      this.renderImage(this.community.attributes);
    }.bind(this));
  },

  updateBackgroundImage: function () {
    var data = {
      communityId: this.community.attributes.communityId,
      banner: this.community.attributes.banner,
      updatedAt: this.community.attributes.updatedAt,
    };
    $.ajax({
      url: '/api/community/logo/update/' + this.community.attributes.communityId,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
    }).done(function (data) {
      this.community.set('banner', data.banner);
      this.community.set('updatedAt', data.updatedAt);
      this.renderBackgroundImage(this.community.attributes);
    }.bind(this));
  },

  removeImage: function (event) {
    var deleteModal = new Modal({
      id: 'confirm-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Confirm image removal',
      modalBody: 'Are you sure you want to remove the ' + (event.currentTarget.id == 'photo-remove' ? 'community logo': ' backgroung image') + '? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Remove',
        action: function () {
          if (event.currentTarget.id == 'photo-remove') {
            this.removePhoto.bind(this)();
          } else {
            this.removeBackgroundImage.bind(this)();
          }
          deleteModal.cleanup();
        }.bind(this),
      },
    });
    deleteModal.render();
  },

  removePhoto: function () {
    var data = {
      communityId: this.community.attributes.communityId,
      imageId: null,
      updatedAt: this.community.attributes.updatedAt,
    };
    $.ajax({
      url: '/api/community/logo/remove/' + this.community.attributes.imageId,
      type: 'POST',
      data: data, 
    }).done(function (data) {
      this.community.set('imageId', null);
      this.community.set('updatedAt', data.updatedAt);
      this.renderImage(this.community.attributes);
    }.bind(this));
  },

  removeBackgroundImage: function () {
    var backgroundImageId = this.community.attributes.banner.backgroundImageId;
    var data = {
      communityId: this.community.attributes.communityId,
      banner: this.community.attributes.banner,
      updatedAt: this.community.attributes.updatedAt,
    };
    delete data.banner.backgroundImageId;
    $.ajax({
      url: '/api/community/logo/remove/' + backgroundImageId,
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
    }).done(function (data) {
      this.community.set('banner', data.banner);
      this.community.set('updatedAt', data.updatedAt);
      this.renderBackgroundImage(this.community.attributes);
    }.bind(this));
  },

  validateFields: function () {
    return _.reduce(this.$el.find('.validate'), function (abort, child) {
      return validate({ currentTarget: child }) || abort;
    }, false);
  },

  validateField: function (e) {
    return validate(e);
  },

  cancel: function (e) {
    e.preventDefault && e.preventDefault();
    window.history.back();
  },

  save: function (e) {
    e.preventDefault && e.preventDefault(); 
    var data = this.getDataFromPage();
    if(this.community.attributes.communityId) {
      data.updatedAt = this.community.get('updatedAt');
    }
    if(this.validateFields()) {
      $('.usa-input-error').get(0).scrollIntoView();
    } else {
      $('#community-save-error').hide();
      if(this.community.attributes.communityId) {
        this.community.trigger('community:save', data);
      } else {
        this.saveCommunity(data);
      }
    }
  },

  saveCommunity: function (data) {
    $.ajax({
      url: '/api/community',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json',
      success: function (community) {
        Backbone.history.navigate('/admin/community/' + community.communityId + '?saveSuccess', { trigger: true });
      }.bind(this),
      error: function (err) {
        $('#community-save-error').show();
        $('#community-save-error').get(0).scrollIntoView();      
      }.bind(this),
    });
  },

  validatebureau: function (){
    var abort = false; 
    var selectedBureauValue= $('#community_tag_bureau').val();
    var selectedValue=  $('input[name=community-bureau-office-group]:checked').val();
    if(selectedBureauValue =='' && selectedValue=='office') {
      $('#community_drop_bureau').addClass('usa-input-error');     
      $('#community_drop_bureau>.field-validation-error').show();
      abort=true;
    }
    else{
      $('#community_drop_bureau').removeClass('usa-input-error');     
      $('#community_drop_bureau>.field-validation-error').hide();
      abort=false;
    }
    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    } 
    return abort;
  },

  validatebureauOffice: function (bureauId,officeId) {
    var selectedValue=  $('input[name=community-bureau-office-group]:checked').val();
    var bureauValue=$('#community-new-bureau').val();
    var officeValue= $('#community-new-office').val();
    var selectedBureauValue= $('#community_tag_bureau').val();  
    var abort = false; 
    if(((officeValue=='' || selectedBureauValue=='') && bureauId && officeId) || ( selectedValue=='office')){
      if(selectedBureauValue =='') {
        $('#community_drop_bureau').addClass('usa-input-error');     
        $('#community_drop_bureau>.field-validation-error').show();
        abort=true;
      }
      else{
        $('#community_drop_bureau').removeClass('usa-input-error');     
        $('#community_drop_bureau>.field-validation-error').hide();
        abort=false;
      }
      if(officeValue==''){
        $('#community-office-name').addClass('usa-input-error');     
        $('#community-office-name>.field-validation-error').show();
        $('#community-office-name>.exist-validation-error').hide();
        abort=true;
      }
      else{
        $('#community-office-name').removeClass('usa-input-error');     
        $('#community-office-name>.field-validation-error').hide();
        $('#community-office-name>.exist-validation-error').hide();
        abort=false;
      }
    }
    else if((bureauValue=='' && bureauId) || (selectedValue=='bureau' && bureauValue=='')){
      $('#community-bureau-name').addClass('usa-input-error');     
      $('#community-bureau-name>.field-validation-error').show();
      $('#community-bureau-name>.exist-validation-error').hide();
      abort=true;
    } 
    else{
      $('#community-bureau-name').removeClass('usa-input-error');     
      $('#community-bureau-name>.field-validation-error').hide();   
      $('#community-office-name').removeClass('usa-input-error');     
      $('#community-office-name>.field-validation-error').hide();
      $('#community_drop_bureau').removeClass('usa-input-error');     
      $('#community_drop_bureau>.field-validation-error').hide();
      abort=false;
    }

    if(abort) {
      $('.usa-input-error').get(0).scrollIntoView();
    }  
    return abort;
  },

  addbureauOfficeDisplay:function (event){ 
    event.preventDefault && event.preventDefault(); 
    var bureauId= $(event.currentTarget ).data('bureau-id');
    var bureauName=$(event.currentTarget ).data('bureau-title');
    var officeId=$(event.currentTarget ).data('office-id');
    var officeName=$(event.currentTarget ).data('office-title');
    
    var self = this;
    self.initializeBureaus();  
    
    if (this.modalComponent) { this.modalComponent.cleanup(); } 
    var communityId= this.options.communityId; 
  
    var data = {  
      bureaus: this.bureaus,  
      bureauName:bureauName, 
      bureauId:bureauId,
      officeId:officeId,
      officeName:officeName,
    }; 
   
    var modalContent = _.template(AdminCommunityAddBureauOfficeTemplate)(data); 
   
    var bureauOfficeData;   
    var modalTitle;
    if(bureauId && officeId){
      modalTitle ='Edit bureau or office/post';
    }
    else if(bureauId){
      modalTitle='Edit bureau';
    }
    else{
      modalTitle='Add new bureau or office/post';
    }
     
    self.modalComponent = new ModalComponent({         
      el: '#site-modal',
      id: 'add-bureau-office',
      modalTitle:  modalTitle,
      modalBody: modalContent,  
      action: function (){    
      } ,     
      secondary: {
        text: 'Cancel',
        action: function () {          
          self.modalComponent.cleanup();    
        }.bind(this),
      },
      primary: {
        text:  bureauId || officeId ?'Save':'Add',
        action: function () {
          var selectedValue=  $('input[name=community-bureau-office-group]:checked').val();
          if(!self.validatebureauOffice(bureauId,officeId) && !self.checkBureauOfficeExist(self,bureauId,officeId,bureauName,officeName)){
            if(bureauId && officeId){
              bureauOfficeData={
                bureauId: $('#community_tag_bureau').select2('data').id,
                officeId :officeId,
                name: $('#community-new-office').val(),
                dataBureauId: bureauId,
              };    
            }
            else if(bureauId){
              bureauOfficeData={
                bureauId:  bureauId,   
                name: $('#community-new-bureau').val(),
              };
            }
            else if(selectedValue=='bureau'){
              bureauOfficeData={
                name: $('#community-new-bureau').val(),
                selected: selectedValue,
              };
            } 
            else if(selectedValue=='office'){
              bureauOfficeData={
                bureauId:$('#community_tag_bureau').val(),
                name: $('#community-new-office').val(),
                selected: selectedValue,
              };
            }  

            $.ajax({
              url: '/api/admin/community/'+ communityId +'/bureau-office',
              method: 'PUT',
              data:bureauOfficeData,        
            }).done(function (data) {                       
              var index = _.findIndex(self.bureaus, { bureauId: data.bureauId });               
              if(data.bureauId && data.officeId){                     
                var indexOffice = _.findIndex(self.bureaus[index].offices, { id: data.officeId });
               
                if(indexOffice==-1){
                  var OfficeData={
                    id:data.officeId,
                    text : data.name,
                    name: data.name,
                  };
                  self.bureaus[index].offices.push(OfficeData);

                  //Rejecting office from the current index bureau if it moves to another bureau   
                  if(data.dataBureauId && (data.dataBureauId!=data.bureauId)){
                    var newIndex = _.findIndex(self.bureaus, { bureauId: data.dataBureauId }); 
                    self.bureaus[newIndex].offices= _.reject(self.bureaus[newIndex].offices, function (o){
                      return o.name.toLowerCase()== data.name.toLowerCase();
                    });  
                      
                  }                                            
                }
                else {
                  self.bureaus[index].offices[indexOffice].name = data.name;            
                }
                self.bureaus[index].offices= _.sortBy(self.bureaus[index].offices, function (o){
                  return o.name.toLowerCase();
                });           
              }
              else{
                if (index == -1) {
                  self.bureaus.push(data);
             
                } else {
                  self.bureaus[index].name = data.name;
                } 
                self.bureaus= _.sortBy(self.bureaus, function (b){
                  return b.name.toLowerCase();
                });
              }           
              self.renderBureausAndOffices(self.bureaus);
              self.renderBureausOfficesMessages(data,self);         
              self.modalComponent.cleanup();
            }.bind(this)).fail(function () {
              self.modalComponent.cleanup();
            }.bind(this));
          }
        },
      },      
    }).render();  
    self.initializeCounts();
    self.changebureau(bureauId,officeId);

    $('input[name=community-bureau-office-group]').on('change', function (e) {       
      self.changebureau(bureauId,officeId);    
    }.bind(this));

    $('.validate').on('blur', function (e) {
      self.validatebureauOffice(bureauId,officeId);       
    }.bind(this));

    $('.validate').on('change', function (e) {
      self.validatebureau();      
    }.bind(this));
      
    self.initializeSelect2();
    if(bureauId){
      $('#community_tag_bureau').select2('data', {id: bureauId.toString(), text: bureauName.toString()});   
    }
    
    //adding this to show select2 data in modal
    $('.select2-drop, .select2-drop-mask').css('z-index', '99999');
  },

  checkBureauOfficeExist:function (self,bureauId,officeId,targetBureauName,targetOfficeName){  
    var abort= false;
    var selectedValue=  $('input[name=community-bureau-office-group]:checked').val();
    var bureauName=$('#community-new-bureau').val();
    var officeName=$('#community-new-office').val();
    var newbureauId= $('#community_tag_bureau').val();
     
    if(bureauId && officeId && officeName || selectedValue=='office'){
     
      var index = newbureauId ? _.findIndex(self.bureaus, { bureauId:newbureauId }):_.findIndex(self.bureaus, { bureauId:bureauId ? bureauId.toString():'' });    
      var indexOfficeName='';
    
      indexOfficeName = _.findIndex(self.bureaus[index].offices, function (o){
        return o.name.replace(/\s/g, '').toLowerCase() == officeName.replace(/\s/g, '').toLowerCase();
      });
    
      if(indexOfficeName!==-1){
        $('#community-office-name').addClass('usa-input-error');     
        $('#community-office-name>.exist-validation-error').show();
        abort=true;
      }
      else{
        $('#community-office-name').removeClass('usa-input-error');     
        $('#community-office-name>.exist-validation-error').hide();
        abort= false;
      }  
    }
    else if(bureauId && bureauName || selectedValue=='bureau'){
      var indexBureauName='';
      if(targetBureauName){
        var updatedBureauArray = _.reject(self.bureaus, function (b) { 
          return b.name.replace(/\s/g, '').toLowerCase()==targetBureauName.replace(/\s/g, '').toLowerCase(); 
        }); 
        indexBureauName = _.findIndex(updatedBureauArray, function (b) {
          return b.name.replace(/\s/g, '').toLowerCase() == bureauName.replace(/\s/g, '').toLowerCase();
        });
      }
      else{
        indexBureauName = _.findIndex(self.bureaus, function (b) {
          return b.name.replace(/\s/g, '').toLowerCase() == bureauName.replace(/\s/g, '').toLowerCase();
        });
      }
    
      if(indexBureauName!==-1){
        $('#community-bureau-name').addClass('usa-input-error');     
        $('#community-bureau-name>.exist-validation-error').show();
        abort=true;
      }
      else{
        $('#community-bureau-name').removeClass('usa-input-error');     
        $('#community-bureau-name>.exist-validation-error').hide();
        abort=false;
      }  
    }
    return abort;
  },

  changebureau: function (bureauId,officeId){ 
    if(bureauId && officeId){
      $('.bureau-section').hide();
      $('.bureau-office-section').show();
    }
    else if(bureauId){
      $('.bureau-section').show();
      $('.bureau-office-section').hide();
    }
    else if( $('input[name=community-bureau-office-group]:checked').val()=='bureau'){
      $('.bureau-section').show();
      $('.bureau-office-section').hide();   
    }
    else if( $('input[name=community-bureau-office-group]:checked').val()=='office'){
      $('.bureau-section').hide(); 
      $('.bureau-office-section').show();
     
    }
    // eslint-disable-next-line no-empty
    else{    
    } 
  },

  deleteBureau: function (event) {
    var data = {
      bureauId: $(event.currentTarget).data('bureau-id'),
      bureauName: $(event.currentTarget).data('bureau-title'),
      officeId: $(event.currentTarget).data('office-id'),
      officeName: $(event.currentTarget).data('office-title'),
    };
    $.ajax({
      url: '/api/admin/bureau/' + data.bureauId, 
      type: 'GET',
      async: false,
      success: function (data) {             
        this.count = data;
      }.bind(this),
    });
    data.count = this.count;
    var communityId = this.options.communityId;
    var deleteModal = new Modal({
      id: 'confirm-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Confirm delete bureau or office/post',
      modalBody: '<strong>' + data.count + '</strong> internship' + (data.count != 1 ? 's are' : ' is') + ' currently using this bureau. Are you sure you want to remove <strong>' + data.bureauName + '</strong> from your community? <strong>If you delete the bureau, you will also delete all of its offices and posts</strong>.',
      primary: {
        text: 'Delete',
        action: function () {
          this.submitDelete.bind(this)(data, deleteModal,communityId);
        }.bind(this),
      },
    });
    deleteModal.render();
  },

  submitDelete: function (data, deleteModal,communityId) {  
    $.ajax({
      url: '/api/admin/community/'+ communityId +'/bureau/'+ data.bureauId,
      type: 'DELETE',    
    }).done(function (data) {
      deleteModal.cleanup();
      
      this.bureaus= _.reject(this.bureaus,function (b){
        return b.bureauId== data.bureauId;
      });   
      this.renderBureausAndOffices(this.bureaus);
      this.renderBureausOfficesMessages(data,this);  
    }.bind(this)).fail(function (error) {
      deleteModal.displayError('There was an error attempting to delete this bureau.', 'Error Deleting');
    }.bind(this));
  },
  

  deleteOffice: function (event) {
    var data = {
      bureauId: $(event.currentTarget).data('bureau-id'),
      bureauName: $(event.currentTarget).data('bureau-title'),
      officeId: $(event.currentTarget).data('office-id'),
      officeName: $(event.currentTarget).data('office-title'),
    };
    $.ajax({
      url: '/api/admin/bureau/' + data.bureauId + '/office/' + data.officeId, 
      type: 'GET',
      async: false,
      success: function (data) {             
        this.count = data;
      }.bind(this),
    });
    data.count = this.count;
    var communityId = this.options.communityId;
    var deleteModal = new Modal({
      id: 'confirm-office-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Confirm delete office/post',
      modalBody: '<strong>' + data.count + '</strong> internship' + (data.count != 1 ? 's are' : ' is') + ' currently using this office/post. Are you sure you want to remove <strong>' + data.officeName + '</strong> from your community? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Delete',
        action: function () {
          this.submitOfficeDelete.bind(this)(data, deleteModal,communityId);
        }.bind(this),
      },
    });
    deleteModal.render();
  },

  submitOfficeDelete: function (data, deleteModal,communityId) {
    $.ajax({
      url: '/api/admin/community/'+ communityId +'/bureau/'+ data.bureauId + '/office/' + data.officeId,
      type: 'DELETE',    
    }).done(function (data) {   
      deleteModal.cleanup();
      var index=  _.findIndex(this.bureaus, { bureauId:data.bureauId });
      this.bureaus[index].offices= _.reject(this.bureaus[index].offices,function (o){
        return o.id== data.officeId;
      }); 
      this.renderBureausAndOffices(this.bureaus);
      this.renderBureausOfficesMessages(data,this);  
    }.bind(this)).fail(function (error) {
      deleteModal.displayError('There was an error attempting to delete this bureau.', 'Error Deleting');
    }.bind(this));
  },

  initializeBureaus: function () {
    $.ajax({
      url: '/api/enumerations/bureaus', 
      type: 'GET',
      async: false,
      success: function (data) {             
        this.bureaus = _.sortBy(data, function (b){
          return b.name.toLowerCase();
        });
      }.bind(this),
    });
  },

  initializeSelect2: function () {
    $('#community_tag_bureau').select2({
      placeholder: 'Select a bureau',  
      allowClear: true,
      width:'100%',  
    });  
  },

  preview: function (e) {
    var data = this.getDataFromPage();
    data.marked = marked;
    var modalContent = _.template(AdminCommunityPreviewTemplate)(data);
    if (e.preventDefault) e.preventDefault();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'community-preview',
      modalTitle: 'Community search banner preview',
      modalBody: modalContent,
      primary: {},
      secondary: {
        text: 'Close',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
    }).render();
  },

  toggleAutoJoinDisplay: function (e) {
    if ( $(event.target).val() == 'true' ) {
      $('#community-auto-join').show();
    } else {
      $('#community-auto-join').hide();
      $('#community-auto-join-group').prop('checked', false);
    }
  },

  toggleBackgroundDisplay: function (e) {
    if ( $(event.target).val() == 'true') {
      $('#background-photo-banner').show();
      $('#background-color-banner').hide();
    } else {
      $('#background-photo-banner').hide();
      $('#background-color-banner').show();
      $('#background-group').prop('checked', false);
    }
  },

  showUsajobsSearchUrlLinkText: function () {
    $('#usajobsSearchUrlLinkText').hide();
    if ( $('#usajobsSearchUrl').val() ) {
      $('#usajobsSearchUrlLinkText').show();
    }
  },

  validateUsajobsSearchUrlLabel: function (e) {
    if ( $(event.target).val() ) {
      $('#usajobsSearchUrlLinkText').show();
      $('#usajobsSearchUrlLinkText').addClass('required-input');
      $('#usajobsSearchUrl').addClass('validate');
      $('#usajobsSearchUrlLabel').addClass('validate');
    } else {
      $('#usajobsSearchUrlLinkText').hide();
      $('#usajobsSearchUrlLinkText').removeClass('required-input');
      $('#usajobsSearchUrl').removeClass('validate');
      $('#usajobsSearchUrlLabel').removeClass('validate');
    }
    
    var theInput = e.currentTarget;
    // var urlValue = (theInput.value.match(/^(http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i) || [])[0];
    var urlValue = (theInput.value.match(/^(http:\/\/|https:\/\/)[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/i))[0];
    if(!urlValue) {
      $('#usajobsSearchUrlFormGroup').addClass('usa-input-error');
      $('#usajobsSearchUrlFormGroup .field-validation-error').show();
      $('#usajobsSearchUrlFormGroup').get(0).scrollIntoView();
    } else {
      $('#usajobsSearchUrlFormGroup').removeClass('usa-input-error');
      $('#usajobsSearchUrlFormGroup .field-validation-error').hide();
    }
  },

  initializeTextAreaBannerDescription: function () {
    if (this.md1) { this.md1.cleanup(); }
    this.md1 = new MarkdownEditor({
      data: this.community.get('banner').description,
      el: '.markdown-edit-display-description',
      id: 'display-description',
      placeholder: '',
      title: 'Description',
      rows: 6,
      validate: ['html','count500'],
    }).render();
  },

  disableCommunity: function (e) {
    if ($(event.target).prop('checked')) {
      $('#disable-community-group').prop('checked', false);
      var disableCommunityModal = new Modal({
        id: 'confirm-disable',
        alert: 'error',
        action: 'delete',
        modalTitle: 'Are you sure?',
        modalBody: 'You\'re about to disable <strong>' + this.community.attributes.communityName + '</strong>. This means this community will become read-only and only visible to Sitewide Admins and Community Managers. Are you sure you want to proceed?',
        primary: {
          text: 'Disable',
          action: function () {
            $('#disable-community-group').prop('checked', true);
            disableCommunityModal.cleanup();
          }.bind(this),
        },
        secondary: {
          text: 'Cancel',
          action: function () {
            $('#disable-community-group').prop('checked', false);
            disableCommunityModal.cleanup();
          }.bind(this),
        },
      });
      disableCommunityModal.render();
    } else {
      $('#disable-community-group').prop('checked', false);
    }
  },

  cleanup: function () {
    if (this.md1) { this.md1.cleanup(); }
    removeView(this);
  },

});

_.extend(AdminCommunityEditView.prototype, ShowMarkdownMixin);

module.exports = AdminCommunityEditView;