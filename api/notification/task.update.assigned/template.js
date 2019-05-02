module.exports = {
  subject: 'You’ve been selected for an opportunity!',
  to: '<%- user.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
