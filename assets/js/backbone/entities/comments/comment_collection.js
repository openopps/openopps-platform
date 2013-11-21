define([
  'underscore',
  'backbone',
  'comment_model',
  'comment_list_controller'
], function (_, Backbone, CommentModel, CommentListController) {
  'use strict';

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
        projectId : data['projectId'],
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
      })

    }
  });

  return CommentCollection;
})