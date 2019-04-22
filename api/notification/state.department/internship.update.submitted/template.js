module.exports = {
  subject: 'New internship opportunity submitted',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
