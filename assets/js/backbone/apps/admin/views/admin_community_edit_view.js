var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityFormTemplate = require('../templates/admin_community_form_template.html');
var CommunityModel = require('../../../entities/community/community_model');

var AdminCommunityEditView = Backbone.View.extend({

  events: {
    'click #community-edit-cancel': 'cancel',
    'click #community-edit-save'  : 'save',
    'blur .validate'     : 'validateField',
    'change .validate'   : 'validateField',
  },

  initialize: function (options) {
    this.options = options;
    return this;
  },

  render: function () {
    $('#search-results-loading').show();
    this.loadCommunity();
    return this;
  },

  initializeListeners: function () {
    this.listenTo(this.community, 'community:save:success', function (cycle) {
      
    }.bind(this));
    this.listenTo(this.community, 'community:save:error', function (model, response, options) {
      $('#community-save-error').show();
      $('#community-save-error').get(0).scrollIntoView();
    });
  },

  loadCommunity: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.communityId,
      dataType: 'json',
      success: function (community) {
        this.community = new CommunityModel(community);
        this.$el.html(_.template(AdminCommunityFormTemplate)(community));
        this.$el.show();
        this.initializeListeners();
        this.initializeCounts();
        $('#search-results-loading').hide();
      }.bind(this),
      error: function () {
        $('#search-results-loading').hide();
        showWhoopsPage();
      },
    });
  },

  initializeCounts: function () {
    [{ id: 'community-name', count: 100}, { id: 'description', count: 500}].forEach(function (item) {
      $('#' + item.id).charCounter(item.count, { container: '#' + item.id + '-count' });
    });
  },

  validateField: function (e) {
    return validate(e);
  },

  validateFields: function () {
    return _.reduce(this.$el.find('.validate'), function (abort, child) {
      return validate({ currentTarget: child }) || abort;
    }, false);
  },

  cancel: function (e) {
    e.preventDefault && e.preventDefault();
    window.history.back();
  },

  save: function (e) {
    e.preventDefault && e.preventDefault();    
    if(this.validateFields()) {
      $('.usa-input-error').get(0).scrollIntoView();
    } else {
      $('#community-save-error').hide();
      this.community.trigger('community:save', {
        communityId: this.options.communityId,
        name: $('#community-name').val(),
        description: $('#description').val(),
        supportEmail: $('#community-support-email').val(),
        isClosedGroup: $("input[name='community-group']:checked").val(),
      });
    }
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminCommunityEditView;