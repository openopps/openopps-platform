module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) - One of your internship has been canceled.',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      user: model.user,
    };
    done(null, data);
  },
};