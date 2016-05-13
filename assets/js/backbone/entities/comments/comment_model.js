var _ = require('underscore');
var Backbone = require('backbone');


var CommentModel = Backbone.Model.extend({

  urlRoot: '/api/comment',

  initialize: function () {
    this.saveComment();
  },

  saveComment: function () {
    var self = this;

    this.listenTo(this, 'comment:save', function (parentId, comment) {
      self.save({
        parentId  : parentId,
        value     : comment,
      }, {
        success: function (data) {
          self.trigger("comment:save:success");
        }
      })
    })
  }

});

module.exports = CommentModel;
