'use strict';
var _ = require('underscore');
var Backbone = require('backbone');

var TaskModel = Backbone.Model.extend({

  defaults: {
    title : null,
    description : null,
    tags: null,
    state: 'draft',
    restrict: {
      name: '',
      abbr: '',
      domain: '',
      slug: '',
      projectNetwork: false,
    },
  },

  urlRoot: '/api/task',

  initialize: function () {

    this.listenTo(this, 'task:save', function (data) {
      this.save(data);
    });

    this.listenTo(this, 'task:model:fetch', function (data) {
      this.remoteGet(data);
    });

    this.listenTo(this, 'task:update', function (data) {
      this.update(data);
    });

    this.listenTo(this, 'task:update:state', function (state) {
      this.updateState(state);
    });

    this.listenTo(this, 'task:update:orphan', function (data) {
      this.orphan(data);
    });
  },

  update: function (data) {
    var self = this;
    this.save(data, {
      success: function (data) {
        self.trigger('task:update:success', data);
      },
    });
  },

  updateState: function (state) {
    var self = this;

    this.save({
      state: state
    }, {
      success: function(data) {
        self.trigger("task:update:state:success", data);
      }
    });
  },

  // TODO: I think this had to do with projects...
  orphan: function(data) {
    var self = this;

    this.save({
      projectId: null
    }, {
      success: function(data) {
        self.trigger("task:update:orphan:success", data);
      }
    });

  },

  remoteGet: function (id) {
    var self = this;
    this.set({ id: id });
    this.fetch({
      success: function (data) {
        self.trigger("task:model:fetch:success", data);
      },
      error: function(data, xhr) {
        self.trigger("task:model:fetch:error", data, xhr);
      }
    });
  },

  /*
   * Check if the current model is a draft.
   * @return { Boolean } Returns true if current state is draft.
   */
  isDraft: function () {
    return 'draft' === this.attributes.state;
  },

  /*
   * Check if the current model is a submission.
   * @return { Boolean } Returns true if current state is submitted.
   */
  isSubmission: function () {
    return 'submitted' === this.attributes.state;
  },

  /*
   * Check if the current task has been submitted by checking the current
   * state to not be `draft` or `submitted` or to check if it has a `submittedAt`
   * date associated with it.
   * @return { Boolean }
   */
  hasBeenSubmitted: function () {
    return (
      this.attributes.submittedAt ||
      ( ! this.isDraft() && ! this.isSubmission() )
    );
  },

});

module.exports = TaskModel;
