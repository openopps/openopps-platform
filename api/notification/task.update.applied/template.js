module.exports = {
  subject: 'Someone has applied to your opportunity',
  to: '<%= owner.governmentUri ? owner.governmentUri : owner.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
      owner: model.task.owner,
    };
    done(null, data);
  },
};
