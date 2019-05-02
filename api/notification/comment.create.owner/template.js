module.exports = {
  subject: 'There&rsquo;s a new comment on "<%- task.title %>"',
  to: '<%- owner.uri %>',
  data: function (model, done) {
    var data = {
      comment: model.comment,
      commenter: model.commenter,
      task: model.task,
      owner: model.owner,
    };
    done( null, data );
  },
};
