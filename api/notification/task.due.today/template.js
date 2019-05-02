module.exports = {
  subject: '<%- task.title %> is due today',
  to: '<%- volunteers %>',
  cc: '<%- owner.uri %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      owner: model.owner,
      volunteers: model.volunteers,
    };
    done(null, data);
  },
};
