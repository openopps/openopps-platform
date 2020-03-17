module.exports = {
  subject: 'Your opportunity is complete — thank you!',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
    };
    done(null, data);
  },
};
