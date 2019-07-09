module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – The cycle has closed.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,
      archivelink: model.archivelink,
    };
    done(null, data);
  },
};
