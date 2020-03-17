module.exports = {
  subject: 'New opportunity submitted by an opportunity creator',
  to: '<%= admin.governmentUri ? admin.governmentUri : admin.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      community: model.community,
      admin: model.admin,
    };
    done(null, data);
  },
  includes:[
    'task.update.submitted',
  ],
};