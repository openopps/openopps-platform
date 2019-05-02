module.exports = {
  subject: 'Thank you for your application to the U.S. Department of State Student Internship Program (Unpaid)',
  to: '<%= user.uri %>',
  data: function (model, done) {
    var data = {
      application: model.application,
      user: model.user,
      cycle: model.cycle,
    };
    done(null, data);
  },
};
