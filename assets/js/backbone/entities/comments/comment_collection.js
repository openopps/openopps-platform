'use strict';
var _ = require('underscore');
var Backbone = require('backbone');
var CommentModel = require('./comment_model');
var CommentListController = require('../../apps/comments/list/controllers/comment_list_controller');

var CommentCollection = Backbone.Collection.extend({

  urlRoot: '/api/comment',

  model: CommentModel,

  initialize: function () {
    var self = this;

    this.listenTo(this, "comment:save", function (data, currentTarget) {
      self.addAndSave(data, currentTarget);
    });

  },

  addAndSave: function (data, currentTarget) {
    var self = this, comment;

    comment = new CommentModel({
      parentId  : data['parentId'],
      value     : data['comment'],
      taskId    : data['taskId'],
      topic     : data['topic']
    })

    self.add(comment);

    self.models.forEach(function (model) {
      if (model.attributes.value === data['comment']) {
        model.save(null, {
          success: function (modelInstance, response) {
            self.trigger("comment:save:success", modelInstance, response, currentTarget);
          }
        });
      }
    });

  }
});

module.exports = CommentCollection;
