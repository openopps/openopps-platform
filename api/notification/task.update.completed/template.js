module.exports = {
  subject: '<%- task.title %> is complete — thank you!',
  to: '<%- user.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      survey: openopps.survey,
    };
    done(null, data);
  },
};
