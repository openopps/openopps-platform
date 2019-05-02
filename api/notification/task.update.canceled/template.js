module.exports = {
  subject: 'Opportunity has been canceled',
  to: '<%- user.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};