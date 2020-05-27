module.exports = {
  subject: 'There\'s a new comment on "<%= task.title %>"',
  to: '<%= recipient.governmentUri ? recipient.governmentUri : recipient.username %>',
  data: function (model, done) {
    var data = {
      comment: model.comment,
      commenter: model.commenter,
      task: model.task,
      recipient: model.recipient,
    };
    done( null, data );
  },
};
