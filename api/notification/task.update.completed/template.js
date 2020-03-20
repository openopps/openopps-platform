module.exports = {
  subject: '<%- task.title %> is complete — thank you!',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
      survey: openopps.survey,
    };
    done(null, data);
  },
};
