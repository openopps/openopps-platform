'use strict';
var _ = require('underscore');
var Backbone = require('backbone');
var CommentModel = require('./comment_model');
var CommentListController = require('../../apps/comments/list/controllers/comment_list_controller');

var CommentCollection = Backbone.Collection.extend({

  urlRoot: '/api/comment',

  model: CommentModel,

  initialize: function () {
    this.listenTo(this, 'comment:save', function (data, currentTarget) {
      this.addAndSave(data, currentTarget);
    }.bind(this));
  },

  addAndSave: function (data, currentTarget) {
    var comment = new CommentModel({
      parentId  : data['parentId'],
      value     : data['comment'],
      taskId    : data['taskId'],
      topic     : data['topic'],
    });

    this.add(comment);

    this.models.forEach(function (model) {
      if (model.attributes.value === data['comment']) {
        model.save(null, {
          success: function (modelInstance, response) {
            this.trigger('comment:save:success', modelInstance, response, currentTarget);
          }.bind(this),
          error: function (model, response, options) {
            this.trigger('comment:save:error', model, response, options);
          }.bind(this),
        });
      }
    }.bind(this));
  },
});

module.exports = CommentCollection;
