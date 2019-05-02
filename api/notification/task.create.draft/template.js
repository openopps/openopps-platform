module.exports = { 
  subject: 'New Open Opportunity Draft Created',
  to: '<%= user.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
