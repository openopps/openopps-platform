module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – Application withdrawn',
  to: '<%- user.username %>',
  data: function (model, done) {
    var data = {
      application: model.application,
      user: model.user,
      cycle: model.cycle,
    };
    done(null, data);
  },
};