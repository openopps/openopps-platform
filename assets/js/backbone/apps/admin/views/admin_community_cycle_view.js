var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');

var AdminCommunityCycleTemplate = require('../templates/admin_community_cycle_template.html');
var AdminCommunityCycleEditView = require('./admin_community_cycle_edit_view');
var ModalComponent = require('../../../components/modal');

var AdminCommunityCycleView = Backbone.View.extend({

  events: {
    'click #create-cycle': 'initializeCycleEditView',
    'click .delete-cycle': 'deleteCycle'
  },

  initialize: function (options) {
    this.options = options;
    this.params = new URLSearchParams(window.location.search);
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

  deleteCycle: function (event) {
    this.deleteModal = new ModalComponent({
      id: 'confirm-deletion',
      alert: 'error',
      action: 'delete',
      modalTitle: 'Delete cycle confirmation',
      modalBody: 'Are you sure you want to delete <strong>' + event.currentTarget.getAttribute('data-cycle-title') + '</strong>? <strong>This cannot be undone</strong>.',
      primary: {
        text: 'Delete cycle',
        action: function () {
          this.submitDelete.bind(this)(event.currentTarget.getAttribute('data-cycle-id'));
        }.bind(this),
      },
    });
    this.deleteModal.render();
  },

  submitDelete: function (cycleId) {
    $.ajax({
      url: '/api/cycle/' + this.community.communityId + '/' + cycleId,
      type: 'DELETE',
      data: {
        communityId: this.community.communityId,
        cycleId: cycleId,
      }
    }).done(function ( model, response, options ) {
      this.deleteModal.cleanup();
      this.render();
    }.bind(this)).fail(function (error) {
      this.deleteModal.displayError('An unexpected error occured attempting to delete this cycle.', 'Delete cycle error');
    }.bind(this));
  },

  loadCommunityData: function () {
    $.ajax({
      url: '/api/admin/community/' + this.options.targetId,
      dataType: 'json',
      success: function (targetInfo) {
        this.community = targetInfo;
        if (this.params.has('edit')) {
          this.initializeCycleEditView({});
        } else {
          this.renderTemplate();
        }
        $('#search-results-loading').hide();
      }.bind(this),
    });
  },

  renderTemplate: function () {
    var template = _.template(AdminCommunityCycleTemplate)(this.community);
    this.$el.html(template);
    this.rendered = true;
    this.data.target = this.options.target;
  },

  initializeCycleEditView: function (event) {
    event.preventDefault && event.preventDefault();
    var cycleId = this.params.get('edit') || 'new';
    Backbone.history.navigate('/admin/community/' + this.community.communityId + '/cycles?edit=' + cycleId, { trigger: false });
    this.cycleEditView = new AdminCommunityCycleEditView({
      el: '#admin-cycle',
      community: this.community,
      cycle: _.find(this.community.cycles, function (cycle) { return cycle.cycleId == cycleId; }),
    }).render();
  },

  cleanup: function () {
    this.cycleEditView && this.cycleEditView.cleanup();
    removeView(this);
  },

});

module.exports = AdminCommunityCycleView;
