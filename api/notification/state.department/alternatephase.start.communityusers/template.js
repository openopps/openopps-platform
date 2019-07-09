module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – Alternate phase - Time to choose your interns.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      given_name: model.given_name,
      reviewboardlink: model.reviewboardlink,      
      title: model.title,
    };
    done(null, data);
  },
};
