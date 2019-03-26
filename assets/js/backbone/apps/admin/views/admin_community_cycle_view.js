var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_template.html');
var AdminCommunityCycleEditView = require('./admin_community_cycle_edit_view');
var ModalComponent = require('../../../components/modal');

var AdminCommunityCycleView = Backbone.View.extend({

  events: {
    'click #create-cycle': 'initializeCycleEditView'
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      user: window.cache.currentUser,
      target: this.options.target,
    };
    this.initializeListeners();
  },

  initializeListeners: function () {
  },

  render: function (replace) {
    this.$el.show();
    this.loadCommunityData();
    return this;
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this.community = targetInfo;
        this.renderTemplate();
      }.bind(this),
    });
  },

  renderTemplate: function () {
    var template = _.template(AdminCommunityCycleTemplate)(this.community);
    this.$el.html(template);
    this.rendered = true;
    this.data.target = this.options.target;
    $('#search-results-loading').hide();
  },

  initializeCycleEditView: function (event) {
    event.preventDefault && event.preventDefault();
    Backbone.history.navigate('/admin/community/' + this.community.communityId + '/cycles/new', { trigger: false });
    this.cycleEditView = new AdminCommunityCycleEditView({
      el: '#admin-cycle',
      community: this.community,
    }).render();
  },

  cleanup: function () {
    this.cycleEditView && this.cycleEditView.cleanup();
    removeView(this);
  },

});

module.exports = AdminCommunityCycleView;
