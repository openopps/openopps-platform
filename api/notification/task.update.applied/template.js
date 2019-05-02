module.exports = {
  subject: 'Someone has applied to your opportunity',
  to: '<%- owner.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      owner: model.task.owner,
    };
    done(null, data);
  },
};
