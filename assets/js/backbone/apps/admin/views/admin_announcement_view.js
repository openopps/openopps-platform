var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var MarkdownEditor = require('../../../components/markdown_editor');
var AdminAnnouncementTemplate = require('../templates/admin_announcement_template.html');
var Modal = require('../../../components/modal');

var AdminAnnouncementView = Backbone.View.extend({

  events: {
    'click .link'   : 'link',
    'click #save-btn'   : 'save',
    'click #preview-btn': 'preview',
    'click #edit-btn'   : 'edit',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.announcement;
  },

  render: function (replace) {
    this.$el.show();

    // get meta data for announcement
    $.ajax({
      url: '/api/announcement',
      dataType: 'json',
      success: function (announcementInfo) {
        this.announcement = announcementInfo;
        var template = _.template(AdminAnnouncementTemplate)({ announcement: announcementInfo }); 
        this.$el.html(template);
        this.displayPreviewLoad();
      }.bind(this),
    });
    
    return this;
  },

  initializeTextAreaAnnouncement: function () {
    if (this.md) { this.md.cleanup(); }
    this.md = new MarkdownEditor({
      data: '',
      el: '.markdown-edit',
      id: 'announcement',
      placeholder: '',
      title: 'Announcement',
      rows: 6,
      validate: ['empty','html'],
      preview: true,
    }).render();
  },

  preview: function (e) {
    e.preventDefault();
    this.displayPreviewLoad();
  },

  displayPreviewLoad: function (){
    $('.usajobs-opop-announcement__title').html($('#announcement-title').val());
    $('.usajobs-opop-announcement__section').html($('#announcement-description').val());
    $('.preview').show();
    $('.edit').hide();
    $('#preview-btn').hide();
    $('#edit-btn').show();
    $('#save-btn').hide();
  },

  edit: function (e) {
    e.preventDefault();
    $('.preview').hide();
    $('.edit').show();
    $('#preview-btn').show();
    $('#edit-btn').hide();
    $('#save-btn').show();
  },

  save: function (e) {
    e.preventDefault();
    $('#save-btn').attr('disabled', true);
    $.ajax({
      url: '/api/announcement',
      method: 'PUT',
      data: {
        id: this.announcement.id,
        title: $('#announcement-title').val(),
        description: $('#announcement-description').val(),
      },
      success: function () {
        this.modal = new Modal({
          el: '#site-modal',
          id: 'save-announcement',
          modalTitle: 'Changes saved',
          modalBody: 'Changes to the announcement were made successfully.',
          primary: {
            text: 'Close',
            action: function () {
              this.modal.cleanup();
              Backbone.history.navigate('/admin', { trigger: true });
            }.bind(this),
          },
        }).render();
      },
      error: function () {
        this.modal = new Modal({
          el: '#site-modal',
          id: 'save-announcement',
          modalTitle: 'An error occured',
          modalBody: 'An error occured trying to save the announcement changes.',
          primary: {
            text: 'Close',
            action: function () {
              this.modal.cleanup();
              Backbone.history.navigate('/admin', { trigger: true });
            }.bind(this),
          },
        }).render();
      },
    });
  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.announcement.slug);
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAnnouncementView;
