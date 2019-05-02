module.exports = {
  subject: 'An update on <%- task.title %>',
  to: '<%- user.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
