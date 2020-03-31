module.exports = {
  subject: 'You’ve been selected for an opportunity!',
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
