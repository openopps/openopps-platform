module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid)—You have been selected as an alternate for an internship.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,         
      office: model.office,
      session: model.session,
      jobLink: model.jobLink,
      contact_email: model.contact_email,
      title: model.title,
    };
    done(null, data);
  },
};
