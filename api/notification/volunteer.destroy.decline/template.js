module.exports = {
  subject: 'Application withdrawn',
  to: '<%= owner.governmentUri ? owner.governmentUri : owner.username %>',
  cc: '',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
      owner: model.owner,
    };
    done(null, data);
  },
};
