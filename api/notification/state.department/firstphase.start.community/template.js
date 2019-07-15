module.exports = {
  subject: 'U.S. Department of State Student Internship Program (Unpaid) – Primary phase - Time to choose your interns.',
  to: '<%= email %>',
  data: function (model, done) {
    var data = {
      email: model.email,
      give_name: model.give_name,
      reviewboardlink: model.reviewboardlink,
      title: model.title,
    };
    done(null, data);
  },
};
