module.exports = {
  subject: 'Your internship opportunity is approved',
  to: '<%= user.governmentUri ? user.governmentUri : user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
      cycle: model.cycle,
    };
    done(null, data);
  },
};