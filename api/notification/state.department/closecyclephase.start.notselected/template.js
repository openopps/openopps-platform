module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid)—Thank you for your interest.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,         
      session: model.session,
      applicationsCount: model.applicationsCount,
    };
    done(null, data);
  },
};
